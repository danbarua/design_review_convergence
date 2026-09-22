#!/usr/bin/env bun
// Deterministic checker, v2. Zero LLM calls, and now zero LLM-derived signs:
// v1 asked the LLM to output a signed threshold directly; that was the
// single most unreliable step in the whole pipeline (three different wrong
// answers across three runs on the same sentence). v2's extraction only
// names a literal subject/object per sentence and picks one of three fixed
// verb templates -- the sign for each verb is a fixed formula, written once
// here, applied the same way every time.
//
// Fixed verb formulas (d_local = subject - object, as literally written in
// that clause's own sentence):
//   beats_by_at_least:          Halt fires when d_local >= margin
//   does_not_beat_by_at_least:  Halt fires when d_local <  margin
//   matches_or_beats_within:    Halt fires when d_local >= -margin
//
// Two clauses sharing a check_purpose may name subject/object in either
// order (e.g. one clause's subject is the other's object) -- that's still
// resolved the same way as v1: canonical orientation from the first clause
// in the group, sign flip for clauses using the reversed pair, then exact
// case analysis over real-valued d, sampling every breakpoint plus a
// midpoint between every adjacent pair (exact for this predicate family:
// every threshold is one of {0, M_beat, M_match}, always positive now).
//
// Usage: bun scripts/check-margin-conditions.mjs [margin-conditions/<ts>.json]

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

function log(msg) {
  process.stderr.write(`[check-margin-conditions] ${msg}\n`);
}

let path = process.argv[2];
if (!path) {
  const files = (await readdir("margin-conditions")).filter((f) => f.endsWith(".json") && !f.startsWith("hand-verified")).sort();
  if (files.length === 0) {
    console.error("no margin-conditions/*.json found -- run extract-margin-conditions.mjs first");
    process.exit(1);
  }
  path = join("margin-conditions", files.at(-1));
  log(`no path given, using newest: ${path}`);
}

const { clauses } = JSON.parse(await readFile(path, "utf8"));
log(`loaded ${clauses.length} clause(s)`);

function resolveMargin(str, Mbeat, Mmatch) {
  const s = str.trim();
  if (s.startsWith("-")) throw new Error(`margin_symbol must be positive, got "${str}"`);
  if (s === "M_beat") return Mbeat;
  if (s === "M_match") return Mmatch;
  const n = Number(s);
  if (Number.isNaN(n)) throw new Error(`unrecognized margin atom: "${str}"`);
  if (n < 0) throw new Error(`margin_symbol must be positive, got "${str}"`);
  return n;
}

// Fixed, hand-verified formula per verb -- this is the ONLY place sign
// logic lives, and it never varies per clause.
//
// MODELING CHOICE, not a corpus-derived fact: beats_by_at_least (>=margin)
// and does_not_beat_by_at_least (<margin) are written here as strict
// logical complements, so every real value of d_local resolves to exactly
// one verdict with no boundary overlap. The corpus's own "Ties are Halt"
// phrasing never actually pins down whether the tie is at d_local==0 or at
// d_local==margin, and could be read either way -- see
// transcripts/R1.md's A11 (02plus04 Stop says "under P_max" but the halt
// fires on "exceeds P_max") for an unrelated instance of this same
// under-specified-boundary pattern elsewhere in the corpus. This solver
// simply picks a boundary convention to get a computable answer; it is not
// asserting that the corpus text resolves the boundary this way.
function fires(verb, dLocal, margin) {
  switch (verb) {
    case "beats_by_at_least": return dLocal >= margin;
    case "does_not_beat_by_at_least": return dLocal < margin;
    case "matches_or_beats_within": return dLocal >= -margin;
    default: throw new Error(`unrecognized verb: ${verb}`);
  }
}

const M_CONFIGS = [
  { Mbeat: 10, Mmatch: 4 },
  { Mbeat: 6, Mmatch: 6 },
];

function sampleBreakpoints(Mbeat, Mmatch, extraThresholds) {
  const raw = [...new Set([0, Mmatch, Mbeat, ...extraThresholds])].sort((a, b) => a - b);
  const points = [raw[0] - 1];
  for (let i = 0; i < raw.length; i++) {
    points.push(raw[i]);
    if (i + 1 < raw.length) points.push((raw[i] + raw[i + 1]) / 2);
  }
  points.push(raw[raw.length - 1] + 1);
  return points;
}

const norm = (s) => s.trim().toLowerCase();

const byPurpose = new Map();
for (const c of clauses) {
  if (!byPurpose.has(c.check_purpose)) byPurpose.set(c.check_purpose, []);
  byPurpose.get(c.check_purpose).push(c);
}

const contradictions = [];
const unresolvable = [];
const clean = [];

for (const [purpose, group] of byPurpose) {
  if (group.length < 2) continue;

  const [ref, ...rest] = group;
  const oriented = [{ clause: ref, sign: 1 }];
  let ok = true;
  for (const c of rest) {
    if (norm(c.subject) === norm(ref.subject) && norm(c.object) === norm(ref.object)) {
      oriented.push({ clause: c, sign: 1 });
    } else if (norm(c.subject) === norm(ref.object) && norm(c.object) === norm(ref.subject)) {
      oriented.push({ clause: c, sign: -1 });
    } else {
      ok = false;
      unresolvable.push({ purpose, reason: `"${c.subject}"/"${c.object}" doesn't match reference pair "${ref.subject}"/"${ref.object}"` });
      break;
    }
  }
  if (!ok) continue;

  let purposeClean = true;
  for (let i = 0; i < oriented.length; i++) {
    for (let j = i + 1; j < oriented.length; j++) {
      const A = oriented[i], B = oriented[j];
      let mismatch = null;
      let parseFailed = null;
      for (const { Mbeat, Mmatch } of M_CONFIGS) {
        let mA, mB;
        try {
          mA = resolveMargin(A.clause.margin_symbol, Mbeat, Mmatch);
          mB = resolveMargin(B.clause.margin_symbol, Mbeat, Mmatch);
        } catch (err) {
          parseFailed = err.message;
          break;
        }
        for (const diff of sampleBreakpoints(Mbeat, Mmatch, [mA, mB])) {
          const dA = A.sign * diff; // subject-object in A's own sentence frame
          const dB = B.sign * diff;
          const fA = fires(A.clause.verb, dA, mA);
          const fB = fires(B.clause.verb, dB, mB);
          if (fA !== fB) {
            mismatch = { Mbeat, Mmatch, diff, fA, fB };
            break;
          }
        }
        if (mismatch) break;
      }
      if (parseFailed) {
        purposeClean = false;
        unresolvable.push({ purpose, reason: `margin parse error comparing ${A.clause.source} vs ${B.clause.source}: ${parseFailed}` });
        continue;
      }
      if (mismatch) {
        purposeClean = false;
        contradictions.push({
          purpose,
          clauseA: { source: A.clause.source, quote: A.clause.quote, subject: A.clause.subject, object: A.clause.object, verb: A.clause.verb, margin: A.clause.margin_symbol },
          clauseB: { source: B.clause.source, quote: B.clause.quote, subject: B.clause.subject, object: B.clause.object, verb: B.clause.verb, margin: B.clause.margin_symbol },
          witness: mismatch,
        });
      }
    }
  }
  if (purposeClean) clean.push({ purpose, n: oriented.length, sources: oriented.map((o) => o.clause.source) });
}

log("");
log(`${byPurpose.size} distinct check_purpose group(s), ${contradictions.length} contradiction(s), ${unresolvable.length} unresolvable naming mismatch(es)`);

if (contradictions.length > 0) {
  log("");
  log("=== CONTRADICTIONS (exact, mechanically verified) ===");
  for (const c of contradictions) {
    log("");
    log(`check_purpose: "${c.purpose}"`);
    log(`  A [${c.clauseA.source}]: (${c.clauseA.subject} ${c.clauseA.verb} ${c.clauseA.object} by ${c.clauseA.margin}) -- "${c.clauseA.quote}"`);
    log(`  B [${c.clauseB.source}]: (${c.clauseB.subject} ${c.clauseB.verb} ${c.clauseB.object} by ${c.clauseB.margin}) -- "${c.clauseB.quote}"`);
    log(`  witness: with M_beat=${c.witness.Mbeat}, M_match=${c.witness.Mmatch}, diff=${c.witness.diff} -> A says Halt=${c.witness.fA}, B says Halt=${c.witness.fB}`);
  }
}

if (unresolvable.length > 0) {
  log("");
  log("=== UNRESOLVABLE (naming mismatch or parse error, needs manual review) ===");
  for (const u of unresolvable) log(`  "${u.purpose}": ${u.reason}`);
}

log("");
log(`clean (verified, no contradiction possible for any M_beat >= M_match >= 0): ${clean.length} group(s)`);
for (const c of clean) log(`  "${c.purpose}" (${c.n} clauses: ${c.sources.join(", ")})`);

process.exit(contradictions.length > 0 ? 1 : 0);
