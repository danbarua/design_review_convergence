#!/usr/bin/env bun
// Discriminating test: does design-doc review converge, or is "find every
// contradiction" an open-ended task with no fixed point regardless of how
// state is carried between rounds?
//
// The corpus is FROZEN (../10_edge_instruments docs, copied verbatim into
// ./corpus, never edited by this script). Three calls, same starting point:
//
//   R1              -- baseline review of the frozen corpus.
//   R2_stateless     -- a completely independent call, same prompt, same
//                        corpus, no knowledge of R1. Models today's actual
//                        review-design.mjs behavior across rounds.
//   R2_conversational -- same corpus, but R1's full transcript is included
//                        as prior turns, then asked "anything you missed,
//                        or confirm nothing further" as a second user turn.
//
// Hypothesis A (statelessness is the cause): R2_stateless reports many
// "new" findings not in R1; R2_conversational reports ~0 new findings.
// Hypothesis B (no fixed point exists): both R2 variants report new
// findings on an UNCHANGED corpus -- carrying state doesn't fix it because
// there's nothing to converge to.
//
// This script only produces the three transcripts. Classifying round-2
// findings as duplicate-of-round-1 vs genuinely-new is a separate,
// judgment-shaped step done afterward (see README.md).

import Anthropic from "@anthropic-ai/sdk";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

function log(msg) {
  process.stderr.write(`[probe] ${msg}\n`);
}

async function readCorpus() {
  const files = [];
  for (const name of ["DESIGN.md", "HIPPO.md", "PARK.md"]) files.push(join("corpus", name));
  for (const name of await readdir("corpus/instruments")) files.push(join("corpus/instruments", name));
  const docs = await Promise.all(
    files.map(async (p) => ({ name: relative("corpus", p), text: await readFile(p, "utf8") })),
  );
  return docs.map((d) => `--- ${d.name} ---\n${d.text}`).join("\n\n");
}

const SYSTEM = `You review design specifications before anything gets built. These are compiled-component design documents: each names a spec (what the block is for, in units), knobs (the handful of tunable parameters), a meter (the number the block can fail), a halt (conditions that stop the work), a scar (what may be learned, size-capped), and out-of-scope items. A top-level doctrine document states rules meant to apply to every document beneath it. The documents explicitly cross-reference each other by filename.

Cross-check every spec, knob, meter, halt, scar, out-of-scope item, and doctrine rule against every other one -- within a document and across documents. Most conflicts hide in pairs that each read fine alone. Some hide as a doctrine rule that no per-document halt actually enforces -- a rule stated once at the top that nothing underneath checks for is exactly as dangerous as two documents that contradict each other directly, and should be reported the same way.

A knob or meter described as a range, or as an explicit "either/or" choice, is not itself a contradiction -- but it is exactly where a later contradiction will hide once one value is picked. Flag these as unresolved choices, in their own section, separate from genuine contradictions.

Report each contradiction as: the specific passages involved (quote them, name their source document), the scenario that triggers the conflict, and the smallest change that resolves it. Report unresolved choices and ambiguities the same way, in their own clearly separated section -- conflating an ambiguity with a contradiction wastes the reader's attention on the wrong severity.`;

const corpus = await readCorpus();
log(`corpus: ${corpus.length} bytes`);

const anthropic = new Anthropic();
const model = "claude-opus-5-5";

async function call(messages, label) {
  log(`${label}: requesting (adaptive thinking, streaming)...`);
  const stream = anthropic.messages.stream({
    model,
    max_tokens: 64000,
    system: SYSTEM,
    messages,
    thinking: { type: "adaptive" },
  });
  let text = "";
  let thinkingChars = 0;
  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta") {
      if (chunk.delta.type === "text_delta") text += chunk.delta.text;
      else if (chunk.delta.type === "thinking_delta") thinkingChars += chunk.delta.thinking.length;
    }
  }
  const final = await stream.finalMessage();
  log(`${label}: done -- ${text.length} review chars, ${thinkingChars} thinking chars, stop_reason ${final.stop_reason}`);
  if (final.stop_reason === "max_tokens" && text.length === 0) {
    log(`${label}: WARNING -- hit max_tokens with zero output`);
  }
  return text;
}

await mkdir("transcripts", { recursive: true });

const r1Prompt = `Here are our design documents. Find every internal contradiction and unresolved ambiguity before we build any of this:\n\n${corpus}`;

const r1 = await call([{ role: "user", content: r1Prompt }], "R1 (baseline)");
await writeFile("transcripts/R1.md", r1, "utf8");

const r2Stateless = await call([{ role: "user", content: r1Prompt }], "R2_stateless (independent, no R1 context)");
await writeFile("transcripts/R2_stateless.md", r2Stateless, "utf8");

const r2Conversational = await call(
  [
    { role: "user", content: r1Prompt },
    { role: "assistant", content: r1 },
    {
      role: "user",
      content:
        "The design documents above are completely unchanged since your last review -- not one character has been edited. Review them again. If you find anything you missed the first time, report it in the same format. If you find nothing further, say so explicitly and do not restate your prior findings.",
    },
  ],
  "R2_conversational (R1 transcript carried forward)",
);
await writeFile("transcripts/R2_conversational.md", r2Conversational, "utf8");

log("done -- see transcripts/{R1,R2_stateless,R2_conversational}.md");
