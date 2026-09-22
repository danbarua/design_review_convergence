#!/usr/bin/env bun
// v2: removes sign/threshold arithmetic from the LLM entirely. v1 asked
// Haiku to compute a signed threshold (e.g. "-M_beat") from a sentence's
// direction of comparison -- across three separate runs on the SAME
// flagship sentence, it got the sign wrong three different ways (dropped
// the margin to 0, flipped the sign, and once even truncated the quote).
// The one thing Haiku reliably CAN do is literal template matching: which
// of a small fixed set of sentence shapes this is, and which noun phrase is
// the grammatical subject vs object, copied exactly as written. So that's
// all it's asked to do now. All sign derivation moves to
// check-margin-conditions.mjs, as plain deterministic code, from a fixed
// formula per verb -- never from the LLM's arithmetic.
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
        required: ["source", "quote", "check_purpose", "subject", "object", "verb", "margin_symbol"],
        properties: {
          source: { type: "string", description: "document filename this clause appears in" },
          quote: {
            type: "string",
            description: "the exact verbatim sentence, copied character for character from the text, that contains the FULL operative comparison -- not just a trailing parenthetical or a fragment. If the operative clause and its clarifying parenthetical are one sentence, quote the whole sentence.",
          },
          check_purpose: {
            type: "string",
            description: "a short phrase naming WHAT this clause checks. Reuse the IDENTICAL phrase, verbatim, for every clause restating the same named check (even across documents, even in different words). A new phrase means a genuinely different check, not a paraphrase.",
          },
          subject: { type: "string", description: "the grammatical SUBJECT of the comparison verb, copied/canonicalized as a short name exactly as the sentence names it -- the thing doing the beating/matching. E.g. in 'the free conv beats the frozen bank by M_beat', subject='conv'. In 'the frozen bank does not beat the learned conv by M_beat', subject='bank'. Do NOT invert or normalize this to match some other clause's orientation -- always the literal grammatical subject of THIS sentence." },
          object: { type: "string", description: "the grammatical OBJECT of the comparison verb -- the thing being beaten/matched against, exactly as this sentence names it. E.g. subject='conv' pairs with object='bank'; subject='bank' pairs with object='conv'. Always literal to this sentence, never inverted." },
          verb: {
            type: "string",
            enum: ["beats_by_at_least", "does_not_beat_by_at_least", "matches_or_beats_within"],
            description: "which fixed template this sentence matches, literally: 'beats_by_at_least' = 'SUBJECT beats/exceeds OBJECT by MARGIN' (Halt fires when subject clears object by at least the margin). 'does_not_beat_by_at_least' = 'SUBJECT does not beat OBJECT by MARGIN' (Halt fires when subject FAILS to clear object by the margin). 'matches_or_beats_within' = 'SUBJECT matches or beats OBJECT within MARGIN' (Halt fires when subject is within the margin of object, i.e. object does not clearly beat subject by more than the margin -- this is the doctrine-5 'control matches or beats instrument' shape). Pick based on the sentence's own verb phrase, not on what you think the intended rule 'should' be.",
          },
          margin_symbol: {
            type: "string",
            description: "the margin quantity named in the sentence, ALWAYS as a bare positive symbol or number -- 'M_beat', 'M_match', or a literal number. NEVER include a minus sign or any arithmetic here; the verb field already encodes the direction. If you find yourself wanting to write a negative sign, you have the wrong verb -- re-read the sentence and pick the verb template that matches without needing a sign.",
          },
        },
      },
    },
  },
};

const response = await anthropic.messages.create({
  model,
  max_tokens: 16000,
  system: `You extract Halt/Meter/Stop margin clauses from design documents as structured data, using three fixed sentence templates. This is template matching, not arithmetic -- you never compute a sign or a threshold value, you only decide which of three verbs a sentence's own grammar matches, and copy its subject/object exactly as written.

Two examples from the same real document, same two quantities, opposite verbs -- notice subject/object are literal to each sentence, never inverted to align with each other:

"Halt if the free conv beats the frozen bank by M_beat" -> subject='conv', object='bank', verb='beats_by_at_least', margin_symbol='M_beat'.

"Halt: the frozen bank does not beat the learned first conv by M_beat" -> subject='bank', object='conv', verb='does_not_beat_by_at_least', margin_symbol='M_beat'.

Notice these two are about the same two quantities but each keeps ITS OWN sentence's literal subject/object -- you are not asked to reconcile them into one orientation, that happens later by other code. Your only two jobs: (1) match the correct one of the three verb templates to what the sentence literally says, and (2) tag check_purpose so clauses restating the SAME named check get the IDENTICAL phrase. Getting check_purpose wrong (splitting one check into two phrases, or merging two different checks into one phrase) is the most consequential mistake -- when in doubt, ask whether a human would call these 'the same check' or 'two different checks that happen to compare related things'.`,
  messages: [{ role: "user", content: `Extract every Halt/Meter/Stop margin clause (any clause mentioning M_beat and/or M_match, or comparing two named quantities by a stated margin) from these documents:\n\n${corpus}` }],
  output_config: { format: { type: "json_schema", schema } },
});

const raw = response.content?.find((b) => b.type === "text")?.text;
if (!raw) {
  log(`ERROR: no text block. stop_reason=${response.stop_reason}`);
  process.exit(1);
}
const parsed = JSON.parse(raw);

// Hard mechanical check, no LLM: margin_symbol must never carry a sign. If
// it does, extraction ignored the instruction and the sign bug is back --
// fail loudly instead of feeding a silently-wrong value to the solver.
const badSign = parsed.clauses.filter((c) => c.margin_symbol.trim().startsWith("-"));
if (badSign.length > 0) {
  log(`ERROR: ${badSign.length} clause(s) have a signed margin_symbol, which this schema forbids:`);
  for (const c of badSign) log(`  [${c.source}] "${c.quote}" -> margin_symbol="${c.margin_symbol}"`);
  process.exit(1);
}

const savedPath = `margin-conditions/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
await mkdir("margin-conditions", { recursive: true });
await writeFile(savedPath, JSON.stringify(parsed, null, 2), "utf8");
log(`saved ${parsed.clauses.length} clause(s) to ${savedPath}, all margin_symbol signs verified positive`);
log(`usage ${JSON.stringify(response.usage)}, stop_reason ${response.stop_reason}`);
