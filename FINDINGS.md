# Does design-doc contradiction review converge? (and can any of it be trusted)

Probe corpus: frozen snapshot of `10_edge_instruments`'s DESIGN.md, HIPPO.md, PARK.md,
and 4 instrument docs (`corpus/`, never edited during this probe). All findings below
were checked against the actual quoted text in `corpus/`, not taken on an agent's word.

## Experiment 1 — does a monolithic reviewer converge across rounds?

Three Opus calls (`probe.mjs`), same frozen corpus throughout:

| Run | New contradictions | New enforcement gaps | New ambiguities |
|---|---|---|---|
| R1 (baseline) | 12 | 6 | ~20 |
| R2_stateless (fresh call, blind to R1) | 15 (mostly re-derives R1 under new numbers) | +5 | 22 |
| R2_conversational (R1's transcript in context, told "unchanged, confirm if nothing further") | 7 new | 3 new | 6 new |

**Result:** carrying full conversation state forward did not converge the second pass toward
zero. It produced 16 more items and said so explicitly, on a byte-identical corpus.
This run is inconsistent with "statelessness causes the non-convergence" — consistent with
"find every contradiction" being open-ended over a corpus this dense, independent of state.
n=1; not proven, but the predicted signature of the state-passing fix (near-zero new findings)
did not appear.

## Experiment 2 — does splitting into bounded (closed) questions fix it?

Five specialist subagents, same frozen corpus, each given ONE narrow question capable of
returning "NONE FOUND" (unlike Experiment 1's open "find everything"):

| Specialist | Verdict | Correct? |
|---|---|---|
| MarginHaltAudit | NONE FOUND (23 appearances checked) | **Wrong** — missed known A1/A8 (see below) |
| KnobSpecTypingAudit | 7 findings, structured JSON | Plausible, not independently re-verified |
| CrossInstrumentHandoffAudit | 1 finding (ambiguous "/" in 04's minting clause) | Plausible, not independently re-verified |
| DoctrineEnforcementAudit | 8 (doctrine, instrument) "MISSING" pairs | Contestable — doctrine 1 is enforced by an external wrapper script, not a per-instrument halt; doctrine 4 is explicitly post-Stop per 05's own text, inconsistently applied by the specialist across the other 3 instruments |
| ProvenanceLockAudit | NONE FOUND, all 3 areas | **Wrong** — missed known A12/A15 |

Closed-question framing did make several specialists terminate (2 of 5 reached a bounded
"none found"; the other 3 returned small finite lists rather than open-ended hunting).
That part worked. But two specialists reached a confident wrong "NONE FOUND" on
questions squarely within their stated scope — R1 and R2_stateless had already found and
quoted the missed contradictions independently.

## Experiment 3 — is the miss a scope problem, or is a single call just unreliable?

Reran both failing specialists twice each: once with the *identical* question (tests
reproducibility), once with a *refined* question narrowing to the specific mechanism
suspected to have caused the miss (tests whether better scoping fixes it).

### MarginHalt (target: `02_filterbank.md` L35 "Halt if conv beats bank by M_beat" vs
L41 "Halt if bank does NOT beat conv by M_beat" — an actual burden-of-proof mismatch,
independently found by both R1 (A1) and R2_stateless (A8))

| Run | Result |
|---|---|
| Original | NONE FOUND |
| Rerun, identical question | 2 findings — 04/05 write doctrine-5 mentions as a parenthetical, 02/02plus04 formalize it as its own Halt line. **Verified spurious**: this is a documentation-explicitness difference, not a logical inconsistency — nothing here changes any instrument's actual halt outcome. |
| Rerun, refined question (forces writing each Halt clause as an explicit inequality + numeric counterexample) | 2 different findings — flagged `02plus04.md` L57 (`M_beat` catch-all) vs L58/59 (`M_match` diagnostic sub-conditions) as "NOT EQUIVALENT" with a numeric counterexample. **Verified spurious**: L58/59 fire on a strict subset of L57's range since `M_beat >= M_match` by DESIGN's own rule — these are additive OR-conditions in one Halt list (any one firing = Halt), not competing verdicts on the same decision. The "refined" instruction to hunt for a numeric counterexample found one, but between two clauses that were never claiming to be equivalent in the first place. |

Three attempts, three different answers, **zero reproduced the actual known-real finding**,
and both non-empty answers were independently verified spurious on close reading.

### ProvenanceLock (target: DESIGN.md's "draft at recorded hash is authoritative, one hash"
vs. the template's "LOCK.md must name, in writing... Spec/Knobs/Meter/Halt/Scar" — which
file holds the authoritative numeric value; independently found by R1 (A12) and
R2_stateless (A15))

| Run | Result |
|---|---|
| Original | NONE FOUND, all 3 areas |
| Rerun, identical question | NONE FOUND on areas 1–2, but flagged a **different** contradiction in area 3 (peek-timing "for that bench, from any run" — does v0's data count against v1's lock?). Citation of `02plus04.md` L76 is genuine verbatim text. **Verified spurious on inference**: L76 explicitly says "v1 must **not** change v0's margins" (a prohibition) and separately permits only `P_frozen_inherit` (a structural count, not a margin) — the rerun read this prohibition as permission, backwards. |
| Rerun, refined question (explicitly names the LOCK.md-vs-draft file-of-record axis) | NONE FOUND, all 3 areas, with a fluent explanation for why the axis I asked it to check "does not contradict" — this explanation was not checked against the actual A12/A15 text before this writeup and should be treated as unverified, likely also wrong given the pattern. |

Same pattern: three attempts, three different verdicts, the two attempts with genuinely
verbatim-quoted "findings" both fell apart on close reading of what the quote actually says.

## Failure mode taxonomy (all five observed and evidenced in this session)

1. **Open-ended non-convergence** — "find everything" over a dense corpus has no fixed
   point; more scrutiny keeps surfacing new, real material (Experiment 1).
2. **Bounded-question false negative** — a closed question with a real answer in scope
   gets answered "NONE FOUND" anyway (original MarginHalt, original ProvenanceLock).
3. **Non-reproducibility under identical input** — rerunning the exact same closed
   question against the exact same frozen text does not reproduce the same verdict,
   in either direction (found vs. not-found, and which specific thing was found).
4. **Refinement relocates the error, doesn't fix it** — narrowing the question to target
   the suspected failure mechanism produced a new, differently-wrong answer each time,
   never the target finding.
5. **Accurate citation, inverted inference** — the quote is genuinely verbatim from the
   document, and the conclusion drawn from it is still wrong (reads a prohibition as a
   permission). This is the hardest to catch by spot-checking "is the quote real" alone —
   it requires reading the full quoted sentence's actual logic, not just confirming it exists.

## What actually held up

R1 and R2_stateless's original ~12–15 contradictions (A1–A12 / A1–A15) are the only
findings in this entire session corroborated by two independent runs. They have never
been checked by anything other than two LLM prose passes agreeing with each other —
which, given failure mode 5 above, is not the same as being mechanically verified.

## Implication: what the next artifact should actually be

Every failure mode above except #1 is a claim of the shape "condition P(x), stated in
passage A, and condition Q(x), stated in passage B, produce different outcomes for the
same x" — a pure inequality/interval-logic problem once the two conditions are extracted
as data. `extract-symbols.mjs` already solves the analogous problem (symbol role
conflicts) with a deterministic JS checker, zero extra LLM calls, run for free against
any saved extraction. The same pattern generalizes here:

1. LLM extraction pass (cheap, Haiku-tier): pull every Halt/Meter/Stop clause that
   compares two named quantities against a margin symbol, as structured data
   `{lhs, rhs, op, threshold_symbol, source, quote}` — extraction only, no judgment.
2. Deterministic check (free, no LLM): for every pair of clauses naming the same
   `(lhs, rhs)` comparison, solve whether their two conditions can disagree for some
   real value, using the corpus's own stated symbol relations (e.g. `M_beat >= M_match`)
   as constraints. This is exactly the check that would have caught A1/A8 correctly the
   first time, and would have correctly rejected both of MarginHalt's manufactured
   findings without needing a human to read the algebra by hand.

That mechanical layer is the concrete next thing to build — not another round of LLM
review, bounded or otherwise, at any granularity tried in this session.
