#!/usr/bin/env bun
// Extracts every Halt/Meter/Stop clause in the corpus that compares two named
// quantities against a margin symbol (M_beat, M_match, or a bare number), as
// structured data -- NOT a judgment about whether any two clauses agree.
// Extraction is find-and-tag (Haiku, no thinking): read a sentence, write
// down which two things it compares and the exact inequality that makes its
// Halt fire. It does not decide if two clauses conflict -- that is a
// separate, deterministic, non-LLM step (check-margin-conditions.mjs).
//
// The one judgment call left to the LLM: `check_purpose`, a short phrase
// naming WHAT specific check this clause is (same discipline as
// extract-symbols.mjs's kind-phrase reuse rule -- identical purpose gets the
// identical phrase, verbatim, every time). This is a narrow semantic-identity
// question ("are these two sentences about the same named check"), not an
// inequality-equivalence question. The solver only ever compares clauses
// that share a check_purpose; it never trusts the LLM's arithmetic.
//
// Usage: bun scripts/extract-margin-conditions.mjs <file> [file...]

import Anthropic from "@anthropic-ai/sdk";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative } from "node:path";

function log(msg) {
  process.stderr.write(`[extract-margin-conditions] ${msg}\n`);
}

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error("usage: bun scripts/extract-margin-conditions.mjs <file> [file...]");
  process.exit(1);
}

const docs = await Promise.all(
  paths.map(async (p) => ({ name: relative(process.cwd(), p), text: await readFile(p, "utf8") })),
);
const corpus = docs.map((d) => `--- ${d.name} ---\n${d.text}`).join("\n\n");
log(`read ${docs.length} file(s), ${corpus.length} bytes`);

const anthropic = new Anthropic();
const model = "claude-haiku-4-5";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["clauses"],
  properties: {
    clauses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["source", "quote", "check_purpose", "lhs", "rhs", "operator", "threshold"],
        properties: {
          source: { type: "string", description: "document filename this clause appears in" },
          quote: { type: "string", description: "the exact verbatim sentence or clause, copied character for character from the text -- do not paraphrase" },
          check_purpose: {
            type: "string",
            description: "a short phrase naming WHAT this clause checks, e.g. 'free-conv-vs-frozen-bank margin', 'bank contribution to the composed module', 'wave contribution to the composed module', 'stem vs FIR competitor margin'. CRITICAL: if two clauses are restating the SAME named check (even in different words, different sections, or different documents), you MUST reuse the identical phrase for both, verbatim. A new phrase means this is a genuinely different check, not a paraphrase of one you've already tagged. Do not invent a new phrase just because the sentence looks different -- decide based on whether a human would call these 'the same check' or 'two different checks that happen to compare related things'.",
          },
          lhs: { type: "string", description: "canonical short name for the quantity that must be LARGER for this clause's condition to hold, e.g. 'bank', 'conv', 'wave_readout', '(3)', '(2)'. Use the corpus's own row/parenthetical numbers or symbol names, kept short and consistent." },
          rhs: { type: "string", description: "canonical short name for the other quantity being compared, same naming discipline as lhs" },
          operator: {
            type: "string",
            enum: ["halts_when_lhs_minus_rhs_lt", "halts_when_lhs_minus_rhs_lte", "halts_when_lhs_minus_rhs_gt", "halts_when_lhs_minus_rhs_gte"],
            description: "the exact condition, in terms of d = (lhs - rhs), under which THIS CLAUSE's Halt fires. E.g. 'Halt if the frozen bank does not beat the learned conv by M_beat', with lhs=bank, rhs=conv, means Halt fires when (bank - conv) < M_beat -> halts_when_lhs_minus_rhs_lt. E.g. 'Halt if the free conv beats the frozen bank by M_beat', with lhs=bank, rhs=conv (same lhs/rhs choice, for comparability), means Halt fires when conv beats bank, i.e. (bank - conv) < 0 in the sense that conv > bank by M_beat -> rewrite as (conv - bank) >= M_beat, i.e. (bank - conv) <= -M_beat, i.e. halts_when_lhs_minus_rhs_lte with threshold '-M_beat'. Think carefully about sign: always express the threshold relative to (lhs - rhs) exactly as defined, do not flip lhs/rhs between clauses of the same check_purpose without adjusting operator and threshold sign to match.",
          },
          threshold: {
            type: "string",
            description: "the threshold value/symbol on the right of the operator, as it appears relative to (lhs - rhs): typically 'M_beat', 'M_match', '0', '-M_beat', '-M_match', or a bare number if stated numerically. Must be consistent with the sign convention used in `operator`.",
          },
        },
      },
    },
  },
};

const response = await anthropic.messages.create({
  model,
  max_tokens: 16000,
  system: `You extract Halt/Meter/Stop margin clauses from design documents as structured data. Every clause you extract compares two named quantities and states when a Halt fires, in terms of a margin threshold (M_beat, M_match, or a bare number).

Do not judge whether any two clauses agree or conflict -- that is a separate, deterministic step done after extraction. Your only two jobs: (1) get the sign and operator exactly right by reading the sentence literally, and (2) tag check_purpose so that two clauses restating the SAME named check get the IDENTICAL phrase, verbatim, and two clauses about genuinely different checks get different phrases. Getting (2) right is the single most important thing you do: under-merging (giving the same check two different phrases) hides a real contradiction from the downstream checker; over-merging (giving two different checks the same phrase) manufactures a fake one. When in doubt, ask: if I described what real-world scenario makes this Halt fire, is it the same scenario as this other clause, or a different one?`,
  messages: [{ role: "user", content: `Extract every Halt/Meter/Stop margin clause (any clause mentioning M_beat and/or M_match, or comparing two named quantities by a stated margin) from these documents:\n\n${corpus}` }],
  output_config: { format: { type: "json_schema", schema } },
});

const raw = response.content?.find((b) => b.type === "text")?.text;
if (!raw) {
  log(`ERROR: no text block. stop_reason=${response.stop_reason}`);
  process.exit(1);
}
const parsed = JSON.parse(raw);

const savedPath = `margin-conditions/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
await mkdir("margin-conditions", { recursive: true });
await writeFile(savedPath, JSON.stringify(parsed, null, 2), "utf8");
log(`saved ${parsed.clauses.length} clause(s) to ${savedPath}`);
log(`usage ${JSON.stringify(response.usage)}, stop_reason ${response.stop_reason}`);
