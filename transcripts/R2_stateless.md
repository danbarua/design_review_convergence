# Design review: Edge instruments

Scope: DESIGN.md, HIPPO.md, PARK.md, instruments/02, 04, 05, and 02plus04. LOCKS.md is cited as the origin of several symbols but was not supplied, so I could not check anything that depends on it.

The report has three parts:

- **Part A:** genuine contradictions, meaning texts that disagree about an outcome, plus doctrine rules that nothing enforces.
- **Part B:** unresolved choices and ambiguities.
- **Part C:** notes on non-normative text.

---

## Part A: Contradictions

### A1. Deadlock: 04 and 02+04 each wait on the other for the classical bank

- **04, Spec:** "If 02 is labkit-`closed` **or open**: named frozen substitute (Gabor energy; classical-bank params are minted by 02+04 / this lock, see LOCKS.md)". It also says: "**Input, named in the lock, with the hash of the upstream artefact.**"
- **02plus04, header:** "If 04 is open, `v0` waits for 04's lock."
- **02plus04, Spec:** "Classical-bank params for v0 … **minted in this lock**."
- **DESIGN, table:** 2+4 is to "**kick off first**."

**Scenario.** 02 and 04 are both open, which is the default.

- 04 cannot lock without naming its input and that input's hash.
- If 02+04 mints the bank, that mint only happens after 04's lock exists, so neither can move.
- If 04 mints instead, 02+04 v0 mints a second bank on its own. v0 then copies T and the margins from a bench that ran on different filters.

**Fix.** 04 mints the classical-bank parameters whenever 04 is open. 02plus04 v0 copies those parameters and their hash, together with T and the margins. 02plus04 mints only when 04 is closed. Delete "02+04 /" from 04's clause.

### A2. 02+04 v0 copies 04's margins across a different input

- **04, Spec:** "If 02 has **frozen** …: 02 bank energy including a frozen 1×1 mix."
- **02plus04:** "**`v0` always uses the classical bank.**" It also says to copy T and the margins "verbatim."
- **02plus04, row 4:** "bank + readout, wave off." This is meant to be 04's own control.

**Scenario.**

1. 02 reaches Stop before 04 locks.
2. 04 locks on the frozen-02 input.
3. 02+04 v0 then locks on the classical bank and imports 04's T, M_beat and M_match.

The result is that row 4 is no longer 04's control, and the copied bar was calibrated on a different stem.

**Fix.** Make 04 v0's input always the classical bank. Move the frozen-02 input to "04-alone later work" and to 02+04 v1.

### A3. 04's input clause does not cover a halted 02

- **04, Spec** covers only three cases: "labkit-`closed` **or open**" and "has **frozen**."

**Scenario.** 02 locks, runs and halts, so GATE_35 is `fired`. 02 is then neither open, closed, nor frozen, and 04 has no legal input.

**Fix.** Change the first branch to "If 02 has not frozen."

### A4. The one-module decision is defined in a circle

- **DESIGN:** the decision "is on **iff both** `GATE_35` … **and** `GATE_21` … are closed."
- **DESIGN, table rows 2 and 4:** "(labkit-`closed` if one-module)." The same echo appears in the 02 and 04 Status lines.

**Scenario.** Nobody can close GATE_35 "because the decision is on," because the decision only becomes on once the gate is already closed. Which act comes first is never stated.

**Fix.** Define the one-module decision as a single named labkit act that closes both handles. Change the table rows to "closed by the one-module act."

### A5. DESIGN and 02plus04 give different conditions for minting T and the margins

- **DESIGN:** "If 04 is open, `v0` waits … If the one-module decision is on, 02+04 states those numbers itself."
- **02plus04, header:** "If 04 is closed, this lock states \(T\) and the margins itself."

**Scenario.** GATE_21 is closed and GATE_35 is still open.

- Under DESIGN, 04 is not open and the one-module decision is off, so neither rule applies and T has no source.
- Under 02plus04, v0 mints T.

**Fix.** Change DESIGN's second sentence to "If 04 is closed, 02+04 states those numbers itself."

### A6. 02 can reach Stop without beating its doctrine-5 control by M_beat

- **DESIGN, Margins:** "Stop requires beating **every named comparator** by \(M_{\mathrm{beat}}\)."
- **02, Halt (doctrine 5):** the halt fires only if the linear map on raw patches "matches or beats the bank **within \(M_{\mathrm{match}}\)**."
- **02, Stop:** requires only "the bank beating the learned conv by \(M_{\mathrm{beat}}\)" and the ε thresholds holding.

**Scenario.** The bank beats the linear control by a margin between M_match and M_beat.

- Under 02's text, no halt fires and Stop is met.
- Under DESIGN, it is not Stop, and "any outcome that does not meet Stop is a halt."

**Fix.** Add "and beating the doctrine-5 linear control by \(M_{\mathrm{beat}}\)" to 02's Stop and to its halt list.

### A7. Halts labelled "doctrine 5" do not match doctrine 5's definition

- **DESIGN, doctrine 5:** the readout-does-the-job halt is when the control "matches or beats (the instrument fails to beat the control by more than \(M_{\mathrm{match}}\))."
- **04, Halt:** "does not beat the control by \(M_{\mathrm{beat}}\) … (Doctrine 5 …)."
- **05, Halt:** "does not beat the \(N\)-tap FIR by \(M_{\mathrm{beat}}\) … (Doctrine 5 …)."

**Scenario.** The instrument beats the control by a margin between M_match and M_beat. The 04 and 05 halt fires with the reason "readout does the job," but under doctrine 5 it has not. The final outcome is correct, because it is a halt either way, but `labkit why` records the wrong reason.

**Fix.** In 04 and 05, split this into two halts: a doctrine-5 halt at M_match, and a "Stop not met" halt at M_beat. That is the structure 02plus04 already uses.

### A8. 02 states two different learned-conv halts

- **02, Meter:** "Halt if the free conv beats the frozen bank by \(M_{\mathrm{beat}}\)."
- **02, Halt:** "the frozen bank **does not beat** the learned first conv … by \(M_{\mathrm{beat}}\)."

**Scenario.** The conv beats the bank by 0.5·M_beat.

- Under the Meter text, no halt.
- Under the Halt text, halt.

This matters because DESIGN says halt text "lives here," but both passages are in the locked draft.

**Fix.** Delete the sentence in the Meter section.

### A9. 02+04 Stop says "under" P_max while its halt says "exceeds"

- **02plus04, Halt:** "trained scar exceeds \(P_{\max}\)."
- **02plus04, Stop:** "with the scar **under** \(P_{\max}\)."

**Scenario.** The scar is exactly P_max. No halt fires, but Stop is not met, so the catch-all makes it a halt anyway.

**Fix.** Change Stop to "at or under \(P_{\max}\)."

### A10. 02+04 v1 conflicts with "a halt abandons" and with "Stop means done"

- **DESIGN, doctrine 3:** "A halt **abandons the instrument** … not a follow-up lock of the failed instrument."
- **DESIGN, doctrine 5:** "Stop (success) … the instrument shipped; we are done."
- **02plus04, Build order:** v1 is written "only if 02 has frozen." It is not conditioned on how v0 ended, and it shares the handle `GATE_34`.

**Scenario.**

- If v0 halts, v1 is a follow-up lock of an abandoned instrument.
- If v0 reaches Stop, the instrument is "done" and v1 has no lawful footing.
- Either way, one gate handle ends up carrying two verdicts.

**Fix.** Declare that halt and Stop are scoped per version, and give v1 its own reserved handle. The alternative is to make v1 a new `<id>`.

### A11. v1's margins: "copy 04 at this lock time" versus "must not change v0's"

- **02plus04, Spec:** "copy 04's numbers verbatim **at this lock time** … Later 04 changes do not propagate."
- **02plus04, Build order:** "v1 must not change v0's margins."

**Scenario.** 04 v1 locks with a new M_beat after 02+04 v0 locked and before 02+04 v1 locks. At v1's lock time, "copy 04" means the new number, which "must not change v0's" forbids.

**Fix.** For v1, copy the margins from `instruments/02plus04/v0/LOCK.md`, not from 04.

### A12. v1 cannot write its lock without firing the peek halt

- **02plus04, Halt:** "any meter, threshold, or margin written or changed after any bench data for that bench, from any run, has been seen."
- **02plus04, Build order:** "v0's data is visible … It may state its own \(P_{\mathrm{frozen\_inherit}}\)."

**Scenario.** v1's lock has to write P_frozen_inherit, P_max, the state budget and T_store. All of these are halt thresholds, and they are written after v0's bind-bench data has been seen. The peek halt therefore fires on v1 at lock time.

**Fix.** Scope the peek rule to meters and margins. Exempt caps that are copied verbatim, or derived from an upstream lock's recorded hash.

### A13. The gradient halts have no time scope, so they fire on inherited weights

- **DESIGN, doctrine 2:** "Halt (all instruments): any gradient reaching this block from a loss computed outside its own bench."
- **DESIGN, doctrine 3:** "any blueprint parameter receiving gradient."
- **02, Scar:** in a composed module, the mix "is a **frozen blueprint layer**." It was trained on 02's bench.

**Scenario.** In 02+04 v1, or in 04 on frozen-02 input, the mix is a blueprint parameter that received gradient from a loss outside this bench. Read literally, both halts fire.

**Fix.** Add "during this lock's runs" to both doctrines. Exempt frozen inherited weights counted in \(P_{\mathrm{frozen\_inherit}}\) with a recorded hash.

### A14. Trajectory storage versus the delay halt in 02+04

- **02plus04, Spec:** "\(T_{\mathrm{store}}\): lock writes a finite integer or `inf`."
- **02plus04, Halt (and 04):** "an explicit delay element or buffered state not arising from nearest-neighbour coupling."

**Scenario.** The readout consumes the last k stored frames. That storage is buffered state that does not arise from nearest-neighbour coupling, so the delay halt fires on a configuration that T_store explicitly allows.

**Fix.** Add to DESIGN's Delay definition: "Stored trajectory read only by the readout and never fed back into the dynamics is not a delay."

### A15. Is the lock text in the draft or in LOCK.md?

- **DESIGN, Authority:** once locked, "the draft **at the recorded git hash** is authoritative."
- **DESIGN, template:** "A `…/LOCK.md` must name, in writing, before any run: Spec … Knobs … Meter …"
- **Every draft:** "Lock states \(M_{\mathrm{match}}\) …", "\(P_{\max}\) an integer in the lock." No draft contains the numbers themselves.

**Scenario.** LOCK.md says M_beat = 0.05, and the draft at the recorded hash says "Lock states M_beat."

- The authoritative text has no number, so no halt can fire.
- If LOCK.md governs instead, the wrapper is checking the wrong file, because INSTRUMENT_DOC is the draft.

**Fix.** Pick one:

- LOCK.md is authoritative for values and the draft at the hash is authoritative for text.
- Every value must be written into the draft before the hash is recorded.

### Doctrine rules that no halt or wrapper check enforces

These are reported with the same weight as the contradictions above.

**A16. M_beat ≥ M_match is never checked.**
- **Rule:** DESIGN: "Every lock must satisfy \(M_{\mathrm{beat}} \ge M_{\mathrm{match}}\)."
- **Gap:** the wrapper checks only that headings are non-empty. No instrument's halt list tests this inequality.
- **Scenario:** a lock with M_match = 0.1 and M_beat = 0.02 is accepted. A result 0.05 above the control then both matches within M_match and beats by M_beat, so it fires a match halt while satisfying the Stop margin.
- **Fix:** the wrapper refuses if the inequality fails. Alternatively, add it as a universal halt.

**A17. Knob and cap typing is not enforced.**
- **Rules:** DESIGN: "Fixed scalar values, not ranges … integers where the quantity is a count." "\(P_{\max}\) as an integer." "State budget as an integer." "'pre-written' with no adjacent number is not a spec."
- **Gap:** the wrapper checks only for missing or empty headings, matched by prefix. No halt checks typing.
- **Scenario:** a lock writes "P_max: small" or "4- or 8-neighbour." The halt "exceeds P_max" can then never fire.
- **Fix:** the wrapper refuses non-integer caps, ranges and either/or knobs.
- **Related:** the template places the state budget under **Scar**, but 04 puts it under Knobs, 02+04 under Knobs, and 05 does not state one at all. Move each to Scar, or relax the template.

**A18. The import condition cannot be checked.**
- **Rule:** DESIGN, doctrine 4: an import is valid only if the successor's "time step or pixel pitch equals the lock's."
- **Gap:** no instrument requires its lock to record a time step or a pixel pitch. 05 has "θ in steps" but gives no step duration. 02's aperture, scale and bandwidth have no units, which also breaks the template requirement for a spec "in units."
- **Fix:**
  - 02, 04 and 02+04 locks state pixel pitch.
  - 05's lock states step duration.

**A19. The revocation act is named only in 05.**
- **Rule:** DESIGN, doctrine 4: "after Stop, a named labkit act fires if a successor import changes knobs or scar."
- **Gap:** 05 references it. 02, 04 and 02+04 never name the act, although 02+04 is explicitly built to be imported.
- **Fix:** add a post-Stop revocation line to every instrument's Stop section, naming the act.

**A20. T_store is required by DESIGN but missing from 04 and 05.**
- **Rule:** DESIGN: "Trajectory storage is \(T_{\mathrm{store}}\); the lock writes a finite integer or `inf`."
- **Gap:** 04 has a trajectory over T and never mentions T_store. 05 does not mention it either.
- **Fix:** add a T_store line and the conditional halt to 04 and 05, or write "`inf`, no halt" explicitly.

---

## Part B: Unresolved choices and ambiguities

None of these is a contradiction yet. Each one becomes a contradiction once a value is picked.

### Choices a lock must make

| # | Passage (source) | What breaks once a value is picked | Smallest resolution |
|---|---|---|---|
| B1 | DESIGN table: "Gabor / scattering stem"; 02 Idea: "Gabor, steerable pyramids, and Mallat's scattering" | Scattering adds a second layer, which changes the channel count, the "known impulse response," and the competitor budget | Knobs name the bank family as a constant |
| B2 | 02: "learned first conv / ViT patch+layer-1" | The two have different parameter counts, which changes the halt threshold | Pick one |
| B3 | 02: output count "measured **before or after** a mix"; 04: "bank energy including a frozen 1×1 mix" | Whether energy comes before or after the mix changes what 04 consumes and what "correct band" means | Fix the order: filter → energy → mix, or another order stated explicitly |
| B4 | 02 Scar: "None required. Allowed: … mix"; halt uses \(P_{\max}\) "of the mix (if a mix exists) or \(P_{\max}^{\mathrm{ctrl}}\) (if no scar)" | \(P_{\max}^{\mathrm{ctrl}}\) is defined nowhere in the supplied docs | Lock chooses mix or no mix; define \(P_{\max}^{\mathrm{ctrl}}\) in 02 |
| B5 | 02: "small translation, rotation, and scale"; three thresholds ε, ε_shift, ε_E | Perturbation sizes are unquantified, and it is unclear which ε covers rotation and which covers scale | Lock states perturbation magnitudes and maps each ε to a perturbation |
| B6 | 02: competitor has "the same kernel spatial support" | A multi-scale bank has one support per scale | Specify the largest scale's support, or a per-scale support |
| B7 | 04: "grid size, 4- or 8-neighbour, boundary" | These define the coupling, and 02+04 inherits them | Lock picks; see B13 |
| B8 | 05: "binary vs \(L\)-way" | Sets C's size relative to P_max, and therefore whether the FIR control can fit | Lock picks |
| B9 | 05: "state exceeds \(N\) (or channels \(\times N\))" | Changes when the state halt fires | Lock picks |
| B10 | 05: "\(\Delta\) is fixed by the lock's formula \(\Delta(\theta)\)", with θ "in steps" | The formula itself is a free choice outside the knob discipline. If θ is already in steps, it is unclear whether Δ = 1 step or θ/Δ is the window | Write the formula in the draft now, with units |
| B11 | 05: "beat … by \(M_{\mathrm{beat}}\) on the lag curve" | A curve is being compared against a scalar margin: at every lag, the mean, or the worst case? | Lock states the reduction |
| B12 | 02+04: T_store "finite integer or `inf`" | Interacts with A14 | Lock picks |
| B13 | 02+04 copies "\(T\), \(M_{\mathrm{beat}}\), \(M_{\mathrm{match}}\)", but Knobs also list lattice, coupling and state budget with no stated source | v0 could re-mint the coupling scale and diverge from 04 | List every field copied from 04 |

### Ambiguities in the rules themselves

**B14. What counts as "that bench" for the peek rule?**
- **Passages:** Peek applies to margins written "after any bench data for that bench, from any run." 02+04 uses "04's bind meter."
- **Scenario:** 04 runs before 02+04 v0 locks. If 04 and 02+04 share one bench, the margins v0 copies are "written" after data was seen, and the peek halt fires.
- **Resolution:** define bench identity per `<id>`, and state that a verbatim copy with a recorded hash is not "writing."

**B15. How do gate states map to outcomes?**
- **Passages:** 05's kickoff requires GATE_34 "decided (`fired` or `not-fired`)." Labkit stores fired/not-fired per halt. Reserved handles "may be closed without being declared."
- **Problems:**
  - If GATE_34 is closed, 05 and PARK's induction-head row are blocked forever.
  - It is not stated whether gate `fired` means "a halt fired" or "Stop."
  - One handle serves both v0 and v1.
- **Resolution:** state the mapping from gate states to outcomes, and add a rule for "GATE_34 closed."

**B16. 04 has a lock and is later closed.** 02plus04 copies "at this lock time" but mints "if 04 is labkit-`closed`." If both are true, it is unclear which rule wins.
- **Resolution:** "If a 04 lock exists, copy; otherwise mint."

**B17. What does revocation do to dependents?** If 02's Stop is revoked after 04 or 02+04 v1 consumed the frozen 02, it is unclear whether 02 still counts as "frozen."
- **Resolution:** state whether revocation cascades.

**B18. What counts as "failed in writing"?**
- **Passages:** 05 and 02 tie the phrase to the learned-competitor halt only. HIPPO and PARK gate the warehouse variant on it.
- **Problems:**
  - It is unclear whether a FIR halt or a peek halt also counts.
  - Doctrine 3 says warehouse variants are "park by default," but PARK.md lists only 05's variant.
- **Resolution:** define the phrase, and add PARK rows for the 02 and 04 variants.

**B19. The 02+04 row inputs are undefined and inconsistent.**
- Row 1 uses "raw input energy, no bank." Energy is undefined without a bank.
- Row 2 uses "raw pixels." That is a different input from row 1, so the 2-vs-3 comparison is confounded.
- Row 2's readout cap is unstated. Rows 1 and 4 are capped.
- **Resolution:** define the raw input once, and cap every row's readout.

**B20. "One hash" versus several recorded hashes.** DESIGN says "Criterion time ≡ lock time; one hash." Yet 02+04 records 04's lock hash, and 04 records an "upstream artefact" hash.
- **Resolution:** reword to "one draft hash; upstream hashes are recorded inputs."

**B21. The wrapper matches headings by prefix.** A heading such as "Halting notes" or "Scarring" would satisfy the check.
- **Resolution:** match exact heading names, allowing a parenthetical suffix.

**B22. The symbol T is overloaded.** It means integration time in 04 and 02+04, but a class-conditioned graph in "Bonsai T" and "T from KMNIST class 0."
- **Resolution:** rename the graph, for example to \(W_{\mathrm{Bonsai}}\).

---

## Part C: Non-normative text

These do not bind, but they could mislead a builder.

- **HIPPO.md** says: "A handful of numbers: \(N\), the variant, the timescale \(\Delta\)." Later in the same file, and in 05, Δ is explicitly "not a knob." Reword to "\(N\), the variant, the window \(\theta\)."
- **LOCKS.md** was not supplied. It is cited as the origin of the classical-bank minting (A1) and of every symbol, including \(P_{\max}^{\mathrm{ctrl}}\) (B4). A1, B4, B13 and B20 should be re-checked against it.