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

## Experiment 4 — replace LLM judgment with actual interval arithmetic

Built `scripts/extract-margin-conditions.mjs` (LLM, structured extraction only --
every Halt/Meter/Stop clause as `{lhs, rhs, operator, threshold, check_purpose}`,
no equivalence judgment) and `scripts/check-margin-conditions.mjs` (plain JS,
zero LLM calls -- exact case analysis over real-valued `d = lhs - rhs`, sampling
every breakpoint plus a midpoint between every adjacent pair, which is exact for
this predicate family since every threshold is one of `{0, M_beat, M_match,
-M_beat, -M_match}`). A caught soundness bug (advisory) in the first version of
the checker itself: it only inserted a midpoint between the two symbolic
constants, not between arbitrary resolved threshold pairs, which would have
silently missed disagreements between two negative-signed thresholds. Fixed and
verified against a hand-constructed counterexample before trusting it on real
data.

**The solver is now sound.** The bottleneck moved entirely to extraction:

| Attempt | What happened on the A1 flagship pair (`02_filterbank.md` Meter vs Halt clause) |
|---|---|
| Full-corpus extraction, run 1 | Clause B (the Halt-section sentence) never extracted at all -- checker correctly reported "clean" on incomplete data |
| Isolated single-file extraction | Both clauses captured, but clause A's threshold resolved to `0` instead of `-M_beat` (dropped the margin magnitude entirely) |
| Full-corpus extraction, run 2 | Clause A's sign fixed by hand after a *different* wrong answer (`threshold=M_beat`, should be `-M_beat`); clause B's quote truncated to only the trailing parenthetical, not the actual "does not beat... by M_beat" sentence |

Three attempts, three different failures, on the one schema field (`threshold`)
whose worked example in the extraction prompt already spells out the correct
derivation for this exact sentence. Translating "X beats Y by M_beat" into a
signed inequality is not yet a reliable LLM step, independent of how carefully
the target schema is specified.

**Final verification**: constructed the ground-truth clause pair by hand from
the verified source text (`margin-conditions/hand-verified-A1.json`), with the
sign derivation written out explicitly for both clauses. Ran the (now-sound)
solver against it:

```
check_purpose: "free-conv-vs-frozen-bank margin (A1)"
  A: Halt if the free conv beats the frozen bank by M_beat. Ties are Halt.
  B: Halt: the frozen bank does not beat the learned first conv / patch+layer-1
     by M_beat on the invariance bench. (Ties are Halt...)
  witness: with M_beat=10, M_match=4, diff=-5 -> A says Halt=false, B says Halt=true
```

This is the first result in this entire session that is actually
mechanically verified end to end -- not two LLM prose passes agreeing with
each other (Experiment 1's R1/R2), and not an LLM asserting "NOT EQUIVALENT"
with a self-generated counterexample (Experiment 3's refined reruns, both
shown spurious). A1 is real, confirmed by exact arithmetic over verified text.

**What this actually proves about the original ask.** "Extract as structured
data, check with interval arithmetic" was the right instinct and the
deterministic half of it works exactly as designed -- once. The unresolved
part is upstream: getting a reliable structured extraction of the natural
language into signed inequalities in the first place. That step failed three
different ways in three tries on the single easiest, most heavily-precedented
case in the whole corpus (the exact sentence pair two independent monolithic
reviews had already found and quoted correctly). A production version of this
tool needs either (a) a much narrower, more mechanical extraction grammar for
this corpus's small closed set of phrasings ("X beats Y by S", "X does not
beat Y by S", "X matches or beats Y within S" -- a handful of templates, not
open natural-language parsing), replacing LLM sign-inference with regex
matching against those templates, or (b) a mandatory human verification step
on every extracted clause before it feeds the solver, which is what actually
produced today's one trustworthy result.

## Experiment 4, continued — redesigning the schema to remove sign arithmetic didn't help

Advisory correctly flagged that v1's schema still asked the LLM to compute a
signed threshold directly (the exact reasoning it had already gotten wrong
twice). Redesigned to v2: extraction now only names the literal grammatical
subject/object of a sentence and picks one of three fixed verb templates
(`beats_by_at_least`, `does_not_beat_by_at_least`, `matches_or_beats_within`,
margin always positive) -- pure template matching, no arithmetic, with all
sign derivation moved into the deterministic checker as one fixed formula per
verb. The system prompt's own worked example spells out, for the exact
flagship sentence, the correct answer: `subject='conv', object='bank',
verb='beats_by_at_least'`.

Ran it. The model inverted subject and object on that exact sentence anyway
(`subject='bank', object='conv', verb='does_not_beat_by_at_least'`), producing
a `check_purpose` labeled "bank beats learned conv" that confirms the
inversion was a genuine role-swap, not a labeling slip -- and one that
changes the truth conditions substantially (fires under almost any outcome,
instead of only when the competitor wins decisively). Recall also dropped
(10 clauses extracted vs. 18-19 in the v1 runs; several real clauses missing
entirely).

**Four attempts, four different failures, on the one sentence used as the
running example throughout this whole investigation:**

| Attempt | Schema | Failure |
|---|---|---|
| v1, full-corpus run 1 | signed threshold | clause never extracted |
| v1, isolated-file run | signed threshold | threshold dropped to `0` |
| v1, full-corpus run 2 | signed threshold | sign flipped (`M_beat` instead of `-M_beat`); other clause's quote truncated |
| v2, full-corpus run | template + literal subject/object | subject/object inverted, despite being the system prompt's own worked example |

**This is the actual finding, not a bug queue.** Redesigning the schema to
eliminate one specific reasoning step (sign arithmetic) didn't make the
pipeline more reliable -- it relocated the same underlying judgment (which
quantity plays which role in the comparison) into a different field, where
the model was equally willing to get it wrong, including when handed the
correct answer as a worked example in its own instructions. No further round
of schema or prompt engineering was attempted after this; four independent,
differently-shaped failures on one sentence is sufficient evidence that this
specific translation step is not currently reliable at any schema
granularity tried, not evidence that the fifth attempt would be the one that
works.

## Final, honest state of the tool

- **The deterministic solver is real and works.** Proven sound against a
  hand-built counterexample; mechanically confirmed A1 with a concrete
  numeric witness once given correct data. This part of "extract as
  structured data, check with interval arithmetic" is solid and reusable.
- **LLM extraction of the natural-language comparison into structured form is
  not reliable**, across two schema designs and four attempts, on the single
  easiest case in the corpus. This is upstream of the solver and the solver
  cannot compensate for it -- garbage in, confidently-wrong-looking-clean
  out.
- **The only fully trustworthy result produced in this entire session**
  (across Experiments 1-4, roughly 15 LLM calls) is `hand-verified-A1.json`:
  a human reading the source text, deriving the inequality by hand, and
  writing it down directly, with the derivation shown. Every attempt to get
  an LLM to do that translation step, at any granularity, failed differently
  each time.
- **Recommended next step, if this is worth pursuing further**: do not
  iterate the LLM schema again. Either (a) write a plain regex/string-match
  parser for this corpus's actual small closed set of sentence shapes (this
  corpus uses maybe 6-8 distinct templates total across ~20 clauses -- fully
  enumerable by a human in less time than this experiment took), removing
  the LLM from structural extraction entirely and reserving it only for the
  genuinely open-ended `check_purpose` semantic-identity judgment, or (b)
  accept that every clause requires human sign-off before reaching the
  solver, which is what actually worked today.
