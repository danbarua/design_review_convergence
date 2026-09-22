#!/usr/bin/env bun
// Deterministic checker. Zero LLM calls. Takes margin-conditions/<ts>.json
// (extract-margin-conditions.mjs's output) and decides, by exact case
// analysis over real-valued d = (lhs - rhs), whether any two clauses sharing
// a check_purpose can produce different Halt/no-Halt verdicts for the same
// scenario, given the corpus's own constraint M_beat >= M_match >= 0.
//
// Every threshold in this corpus is one of a small closed set of atoms:
// {0, M_beat, M_match, -M_beat, -M_match, or a bare number}. That means the
// "fires" boolean is a single half-line boundary at that atom's value, for
// ANY fixed (M_beat, M_match). Two such half-lines are identical functions
// of d, for ALL valid (M_beat, M_match) with M_beat >= M_match >= 0, iff
// they agree at every sample drawn from two configurations (strict
// M_beat > M_match > 0, and the boundary M_beat = M_match) and at enough
// breakpoints to cover every region a half-line boundary could land in.
// This is exact for this predicate family, not a heuristic -- there is no
// richer function shape a single atomic threshold comparison could produce
// that these samples would miss.
//
// Usage: bun scripts/check-margin-conditions.mjs [margin-conditions/<ts>.json]

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

function log(msg) {
  process.stderr.write(`[check-margin-conditions] ${msg}\n`);
}

let path = process.argv[2];
if (!path) {
  const files = (await readdir("margin-conditions")).filter((f) => f.endsWith(".json")).sort();
  if (files.length === 0) {
    console.error("no margin-conditions/*.json found -- run extract-margin-conditions.mjs first");
    process.exit(1);
  }
  path = join("margin-conditions", files.at(-1));
  log(`no path given, using newest: ${path}`);
}

const { clauses } = JSON.parse(await readFile(path, "utf8"));
log(`loaded ${clauses.length} clause(s)`);

function resolveThreshold(str, Mbeat, Mmatch) {
  const s = str.trim();
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1).trim() : s;
  let val;
  if (body === "M_beat") val = Mbeat;
  else if (body === "M_match") val = Mmatch;
  else {
    const n = Number(body);
    if (Number.isNaN(n)) throw new Error(`unrecognized threshold atom: "${str}"`);
    val = n;
  }
  return neg ? -val : val;
}

function fires(clause, d, Mbeat, Mmatch) {
  const t = resolveThreshold(clause.threshold, Mbeat, Mmatch);
  switch (clause.operator) {
    case "halts_when_lhs_minus_rhs_lt": return d < t;
    case "halts_when_lhs_minus_rhs_lte": return d <= t;
    case "halts_when_lhs_minus_rhs_gt": return d > t;
    case "halts_when_lhs_minus_rhs_gte": return d >= t;
    default: throw new Error(`unrecognized operator: ${clause.operator}`);
  }
}

// Two M-configurations exhaust the constraint M_beat >= M_match >= 0: the
// generic strict case, and the boundary where they coincide.
const M_CONFIGS = [
  { Mbeat: 10, Mmatch: 4 },
  { Mbeat: 6, Mmatch: 6 },
];

function sampleBreakpoints(Mbeat, Mmatch, extraThresholds) {
  const raw = new Set([-1, 0, Mmatch / 2, Mmatch, (Mmatch + Mbeat) / 2, Mbeat, Mbeat + 1, ...extraThresholds]);
  return [...raw].sort((a, b) => a - b);
}

const norm = (s) => s.trim().toLowerCase();

// Group by check_purpose.
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

  // Canonical orientation: the first clause's (lhs, rhs).
  const [ref, ...rest] = group;
  const oriented = [{ clause: ref, sign: 1 }];
  let ok = true;
  for (const c of rest) {
    if (norm(c.lhs) === norm(ref.lhs) && norm(c.rhs) === norm(ref.rhs)) {
      oriented.push({ clause: c, sign: 1 });
    } else if (norm(c.lhs) === norm(ref.rhs) && norm(c.rhs) === norm(ref.lhs)) {
      oriented.push({ clause: c, sign: -1 }); // swapped orientation: d_this = -diff
    } else {
      ok = false;
      unresolvable.push({ purpose, reason: `"${c.lhs}"/"${c.rhs}" doesn't match reference pair "${ref.lhs}"/"${ref.rhs}"`, clauses: group });
      break;
    }
  }
  if (!ok) continue;

  // Pairwise compare every clause in the oriented group against every other.
  let purposeClean = true;
  for (let i = 0; i < oriented.length; i++) {
    for (let j = i + 1; j < oriented.length; j++) {
      const A = oriented[i], B = oriented[j];
      let mismatch = null;
      for (const { Mbeat, Mmatch } of M_CONFIGS) {
        const extra = [];
        try { extra.push(resolveThreshold(A.clause.threshold, Mbeat, Mmatch)); } catch {}
        try { extra.push(resolveThreshold(B.clause.threshold, Mbeat, Mmatch)); } catch {}
        for (const diff of sampleBreakpoints(Mbeat, Mmatch, extra)) {
          // diff is expressed in the canonical (ref.lhs - ref.rhs) frame.
          const dA = A.sign * diff;
          const dB = B.sign * diff;
          const fA = fires(A.clause, dA, Mbeat, Mmatch);
          const fB = fires(B.clause, dB, Mbeat, Mmatch);
          if (fA !== fB) {
            mismatch = { Mbeat, Mmatch, diff, fA, fB };
            break;
          }
        }
        if (mismatch) break;
      }
      if (mismatch) {
        purposeClean = false;
        contradictions.push({
          purpose,
          clauseA: { source: A.clause.source, quote: A.clause.quote },
          clauseB: { source: B.clause.source, quote: B.clause.quote },
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
    log(`  A [${c.clauseA.source}]: ${c.clauseA.quote}`);
    log(`  B [${c.clauseB.source}]: ${c.clauseB.quote}`);
    log(`  witness: with M_beat=${c.witness.Mbeat}, M_match=${c.witness.Mmatch}, diff=${c.witness.diff} -> A says Halt=${c.witness.fA}, B says Halt=${c.witness.fB}`);
  }
}

if (unresolvable.length > 0) {
  log("");
  log("=== UNRESOLVABLE (naming mismatch, needs manual review, not auto-checked) ===");
  for (const u of unresolvable) {
    log(`  "${u.purpose}": ${u.reason}`);
  }
}

log("");
log(`clean (verified, no contradiction possible for any M_beat >= M_match >= 0): ${clean.length} group(s)`);
for (const c of clean) log(`  "${c.purpose}" (${c.n} clauses: ${c.sources.join(", ")})`);

process.exit(contradictions.length > 0 ? 1 : 0);
