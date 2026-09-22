# Second pass: edge instruments

A second pass found issues the first review missed. They are numbered to continue from the first review. Nothing below restates an earlier finding. Where a new item interacts with an earlier one, I cite the earlier number.

---

## PART A — Contradictions

### A13. The delay halt catches the oscillator's own state

- **DESIGN / Delay:** "an **explicit delay element or buffered state not arising from nearest-neighbour coupling**."
- **04 / Halt:** "an explicit delay element / buffered state not arising from nearest-neighbour coupling is present." The same wording appears in the 02+04 doctrine-3 halt.
- **04 / Idea:** "A population trajectory that has bound 'what belongs together' after time \(T\)."

**Trigger.** Any real oscillator lattice keeps per-node state that is not produced by coupling:

- phase and amplitude, or position and velocity for a second-order node
- intrinsic damping or frequency
- the input energy held as a drive term across all \(T\) steps

Read literally, the halt fires on the instrument itself before any run. This is separate from A10, which concerned trajectory storage for logging.

**Fix.** Change the definition to: "…buffered **copy of a past input or past state**. Each node's own current state, and the current input drive, are not delays."

### A14. Doctrine 4 requires a new-rate lock, but locking at a new rate trips the tuning ban and peek

- **DESIGN / Doctrine 4:** "A different rate is a **new lock**, not a failed import."
- **All instruments / Out of scope:** "Tuning any knob on any data."
- **Peek halt:** "any meter, threshold, or margin written or changed after any bench data for that bench, from any run, has been seen."
- The knobs and thresholds are expressed in rate-dependent units:
  - 05: \(\theta\) "in steps" and \(L\)
  - 02: aperture or patch size, and \(\varepsilon_{\mathrm{shift}}\) (a translation tolerance)
  - 04: grid size

**Trigger.** A successor runs at twice the pixel pitch. The new lock must rescale aperture, grid size, and \(\varepsilon_{\mathrm{shift}}\) after the original lock's bench data has been seen on the same bench.

- Doctrine 4 prescribes this lock.
- Peek, and the tuning ban, forbid it.

**Fix.** Add to doctrine 4: "A rate-change lock may rescale rate-denominated knobs and thresholds **only** by the ratio of rates, stated as a formula in the original lock. That is not writing under peek. Anything else is a new `<id>`."

### A15. 02+04's bench is defined by reference to 04's text, which no hash covers when 04 is closed

- **DESIGN / Authority:** "the draft **at the recorded git hash** is authoritative … **one hash**."
- **02+04 / Spec:** "End-to-end of *this module* is **04's bind meter**…". It must "record **04's lock hash**", and its lattice is "04's named constants, or stated here if 04 closed".
- **DESIGN / Authority (pre-lock):** "the working instrument draft is authoritative."

**Two triggers:**

1. **04 is locked.** 02+04's lock depends on two hashes: its own and 04's. This conflicts with "one hash".
2. **04 is closed, which is the one-module path.** No 04 lock ever exists. Much of 02+04's bench definition lives in 04's working draft:
   - the blob generator
   - overlap exclusion
   - "ARI on two blob ids"
   - the no-mask rule

   That draft stays authoritative and editable after 02+04 locks. A change to 04's draft silently changes 02+04's locked bench. The draft hash cannot catch this.

**Fix.** Require 02+04's draft to restate 04's meter and lattice definitions in its own text before locking. Change "one hash" to "one hash per lock; referenced locks are cited by their own hash".

### A16. Stop is terminal, but 02+04 v1 and "04-alone later work" are planned to follow it

- **DESIGN / Doctrine 5:** "**Stop (success)** … the instrument shipped; **we are done**."
- **02+04 / Stop:** "freeze `bank_wave_v0` … **and stop**."
- **02+04 / Build order:** "Second lock (`bank_wave_v1`)… re-run the four rows."
- **04 / Stop:** "freeze 04 and stop."
- **04 / Idea and Layout:** "Ring / kNN-on-features / estimated \(W\) are **04-alone later work**."

**Trigger.** v0 reaches Stop and 02 later freezes. The documents disagree:

- The build order says to run v1.
- Stop says the work is done.

A halted v0 cannot proceed either, per A6. The earlier A6 fix ("v1 only if v0 is not-fired") routes straight into this contradiction. 04's later layouts have the same problem: after a Stop they conflict with "done", and after a halt they are abandoned. Neither document says whether they are new versions or new `<id>`s.

**Fix.** Define Stop as terminal **per version**. Then add: "A later version of the same `<id>` is permitted only for a stem or layout change named in the Stop'd lock; everything else is a new `<id>`." Fix A6 against this wording.

---

## PART B — Doctrine rules nothing enforces

### B7. The bench data distribution is not locked, and peek does not cover it

- **Doctrine 1 and template:** the rules require the spec to be "in units", written "before any run".
- **Peek:** covers "meter, threshold, or margin" only.
- **The bench generators are undefined in every document:**
  - 02: "synthetic grating / edge"
  - 04: "synthetic overlapping blobs"
  - 05: "detect an event at lag \(\ell\)"

  Blob size and count, overlap fraction, noise, contrast, event statistics, and train/test split are all missing.

**Trigger.** After seeing a run, someone lowers the blob overlap or raises the grating contrast. The meter, thresholds, and margins are unchanged, so no halt fires. The result is still post-hoc.

**Fix.**

- Add "bench generator, its parameters, seeds, and split" to the template's Meter bullet.
- Extend the peek halt to "…meter, threshold, margin, **or bench generator**…".

### B8. Competitor budgets and training effort are stated but never enforced

- **02:** "Lock states the competitor's trainable-parameter integer."
- **05:** "Lock states the competitor's trainable-parameter integer."
- **04 and 02+04:** the control uses the "same architecture and size cap as the scar".

**Gap.**

- No halt fires if a competitor exceeds or falls short of its stated budget.
- No document fixes the competitor's training protocol: optimizer, steps, seeds.

An under-trained or under-provisioned competitor makes every "beat by \(M_{\mathrm{beat}}\)" halt easier to pass. The bias always runs toward Stop.

**Fix.**

- Add a universal halt: "any competitor or control whose trainable-parameter count differs from its lock integer."
- Require each lock to state the competitor and control training budget and seeds. Cover that budget under peek.

### B9. Composition is exempt from the pitch rule, so frozen parts can run off-rate inside the tree

- **Doctrine 4:** "Composition of two instruments in this tree is **not** an import." Only imports require "time step or pixel pitch equals the lock's."

**Trigger.** 02+04 v1, or 04 with a frozen-02 input, applies 02's frozen bank and mix to images at a different pixel pitch than 02's lock. The pitch check would catch this outside the tree. Inside the tree, no halt fires, and the inherited invariance guarantees silently fail to hold.

**Fix.** Add to doctrine 4: "A composing lock must use each inherited part at that part's locked rate, or the halt fires."

---

## PART C — Unresolved choices and ambiguities

### C-i. Explicit choices

| # | Passage (source) | What breaks once picked | Smallest resolution |
|---|---|---|---|
| U13 | "\(T\), \(M_{\mathrm{beat}}\), \(M_{\mathrm{match}}\): copy 04's numbers verbatim" but Knobs lists "coupling" and "state budget" with no copy rule; \(P_{\max}\) is "an integer in the lock" (02+04) | If 02+04 picks its own coupling or readout \(P_{\max}\), it inherits a \(T\) and margins calibrated on a different wave and readout size. The copied bar no longer means the same thing. | State that coupling, state budget, and \(P_{\max}\) are copied together with \(T\) and the margins, or minted together when 04 is closed. |
| U14 | 02 knob "Aperture **/ patch size**"; 02+04 row 2 "wave over raw pixels, no bank"; lattice "04's named constants" including grid size (02+04) | If the bank strides (patch size > 1), rows 2 and 3 cannot share one grid size. Either row 2 breaks the locked lattice, or row 3 runs at a resolution the bank does not produce. | The lock states the bank stride. If stride > 1, it states the row-2 grid and requires coupling to be rescaled by a stated rule. |

### C-ii. Ambiguities

**A-16. 02's competitor output nonlinearity is unstated.**

- The bank is quadrature. "Quadrature is required so 'energy-in-correct-band' is defined."
- It is not stated whether the free conv's channels are paired and squared the same way.
  - If not, a linear conv cannot be phase-invariant under translation, and the bank wins by construction.
  - If yes, channel pairing is part of the competitor architecture and must be fixed.
- The doctrine-5 "linear map … on raw patches" is itself a special case of the free conv. When the conv's parameter count is at least \(P_{\max}\), the stricter \(M_{\mathrm{beat}}\) halt against the conv already covers the doctrine-5 halt, which makes it redundant.

*Fix:* state that both the competitor and the control get the same quadrature-pair energy readout. Also state what the doctrine-5 control tests that the free conv does not, or drop it.

**A-17. Upstream outcomes that have no case.**

- **04 / Spec input clause:** cases exist for 02 "closed or open" and 02 "frozen". There is no case for 02 **fired** (halted).
- **02+04:** "If 04 is open, `v0` waits for 04's **lock**." It waits for the lock, not for a decision. If 04 later **fires**, nothing says whether 02+04 v0 continues. At that point 02+04 has copied \(T\) and margins from an abandoned instrument, and the wave it tests has already failed its own bench.

*Fix:* add explicit cases for 02 fired, which should behave like closed and use the substitute. Also state whether 04 fired halts or leaves unaffected a 02+04 lock that copied from it.

**A-18. Bench identity versus prior data.**

- The peek halt applies to data "for that bench, **from any run**".
- 04 / Honest inheritance cites prior overlapping-blob results: "overlap_bench: learned long-range \(K_2\) helped; mask was doing segmentation."
- If 04's ARI bench reuses overlap_bench's blob generator, bench data has already been seen. Peek then fires the moment 04's margins are written.

*Fix:* define a bench as a named generator plus its parameters. State that pre-programme benches with different generators or parameters are different benches.

**A-19. A 05+04 fusion is implied but cannot be hosted anywhere.**

- **05 / Out of scope:** "Fusing 05 with 04 **in the first lock**." This implies a later lock may fuse them.
- **04 / Out of scope:** "fusing delay into the bind."
- **DESIGN:** the delay threshold applies to 04 and 02+04.
- **HIPPO:** "Do not fuse them in prose."

No existing `<id>` could legally contain a fused delay and bind. It is also unclear whether "a later lock of 05" could.

*Fix:* either delete "in the first lock" from 05, or state that a fused module is a new composed `<id>` with its own delay rule.

---

Everything else I re-checked either matched the first review or was consistent.