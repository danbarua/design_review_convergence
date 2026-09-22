# Edge instruments

**Status:** draft, 2026-09-22. **Not locked.** Folded Opus 5.5 (C1–C23, U1–U13). No number in this tree is a fire line until a versioned `LOCK.md` exists. Symbol origins: [LOCKS.md](LOCKS.md).

**Home:** `github.com/danbarua/edge_instruments` on `main`.

**Authority**

- **Before a lock:** the working instrument draft is authoritative for spec / meter / halt *text*.
- **Once `instruments/<id>/<version>/LOCK.md` exists:** the draft **at the recorded git hash** is authoritative; the working draft is non-normative. **Criterion time ≡ lock time; one hash.**
- **Labkit** is authoritative for *state* (`open` / `fired` / `not-fired` / `closed`). Instrument **Status** lines are non-normative echoes.
- A gate handle is **reserved, not locked**. Reserved handles **may be closed without being declared**. `criterion` / `declare` only after the six headings exist and are non-empty.

**Wrapper (doctrine 1):** [`scripts/lock-instrument.sh`](scripts/lock-instrument.sh). `INSTRUMENT_DOC` is required. It refuses missing **or empty** headings (matched by prefix) and records the draft’s git hash. That hash is the lock hash.

**Lock convention:** drafts live at `instruments/<id>_*.md`, except [`instruments/02plus04.md`](instruments/02plus04.md) (`<id>` = `02plus04`). A lock is `instruments/<id>/<version>/LOCK.md` (example: `instruments/02plus04/v0/LOCK.md`). Promoting a draft in place is not a lock. Two versions never share a path.

**Frozen** ≡ Stop (success) recorded as a labkit act. Not a fifth labkit state; an act.

**Not:** Bonsai Stage 2B. Not addressable-transients Arc 2. Not “train a smaller Llama.”

[HIPPO.md](HIPPO.md) is **non-normative**. [05](instruments/05_hippo_temporal.md) is the instrument.

---

## The idea in one paragraph

A mainstream large model throws away its edge every version: patch embed, first conv, positional table, temporal stem. Those parts have *specs* (orientation, scale, memory horizon, binding radius). Specs can be compiled — a filterbank, a delay, a traveling-wave bind — with a handful of knobs and a tiny scar, then frozen. The warehouse of tensors can sit on top and change. The instrument does not.

This is synth design pointed at the edge of a model: **blueprint first, soup only on the joint you cannot write down.** Scoring is a *component bench*, never “ImageNet went up.” If the readout does the task and the dynamics are decoration, the instrument failed.

---

## Doctrine (not negotiable even while unlocked)

1. **Component spec before search.** No spec → the work is NAS. Park it. The wrapper must refuse unless the six headings exist and are non-empty, and must record the doc’s git hash at lock time.
2. **Forward-prop** means: shoot the candidate through its own bench, keep or tweak. Not backprop through a foundation model. Halt (all instruments): any gradient reaching this block from a loss computed outside its own bench, including through a projector, a head, or a frozen tower.
3. **Scar, not garnish.** A learned **readout** is allowed. **Any gradient to a blueprint parameter, static or input-dependent, is warehouse.** A learned **gate** (input-dependence) on the blueprint parameters \((A,\; B,\; \Delta,\; W,\; \text{the filter set, the coupling matrix})\) is warehouse. A gate on the scar readout itself (\(C\), the 1×1 mix) is also warehouse. Halt (every instrument, doctrine 3): any blueprint parameter receiving gradient, or any input-dependent gate on a blueprint parameter or on the scar readout. A halt **abandons the instrument**. A warehouse variant is a **new** `<id>` with its own gate, park by default — not a follow-up lock of the failed instrument.
4. **Version-stable is an interface test, not a score.** Composition of two instruments in this tree is **not** an import (it is **inheritance** / **composition**; see \(P_{\mathrm{frozen\_inherit}}\)). An **import** is into a **successor** outside this programme. An import is valid only into a successor whose **time step or pixel pitch equals the lock’s**. A different rate is a new lock, not a failed import. The check is “were the knobs and the scar touched?”, not a downstream score. Downstream score is never admissible.

   Import-refit is a **post-stop revocation**, not a bench halt: after Stop, a named labkit act fires if a successor import changes knobs or scar. Stop does **not** wait for a successor to exist.
5. **Halt means abandon.** Readout-does-the-job is a halt: the control **matches or beats** the instrument (the instrument fails to beat the control by more than \(M_{\mathrm{match}}\)). Dynamics must change the meter. **Stop (success)** is a different word: the instrument shipped; we are done. Do not use “halt” for that. **Stop additionally requires every halt in the lock to be not-fired. Any outcome that does not meet Stop is a halt.**

**Margins.** Two symbols, never one. Every lock must satisfy \(M_{\mathrm{beat}} \ge M_{\mathrm{match}}\). \(M_{\mathrm{match}}\) is the indistinguishability band. \(M_{\mathrm{beat}}\) is the superiority margin. **Ties are Halt, not Stop** — Stop requires beating every named comparator by \(M_{\mathrm{beat}}\).

**Caps.** \(P_{\max}\) caps **trained** parameters only. Frozen inherited weights, if any, are a separate integer \(P_{\mathrm{frozen\_inherit}}\) with its own halt (origin: any instrument consuming a frozen mix). **Total state** = live state at one timestep (channels × nodes, or \(N\)). Trajectory storage is \(T_{\mathrm{store}}\); the lock writes a finite integer or `inf` (uncapped). Halt on \(T_{\mathrm{store}}\) only if the lock integer is finite. A stateless block writes state budget `0` and halts if state exceeds `0`.

Halt: trained scar exceeds \(P_{\max}\), or total state exceeds the budget.

**Delay** (04 and 02+04, same threshold): an **explicit delay element or buffered state not arising from nearest-neighbour coupling**. Wave latency from nearest-neighbour coupling is not a delay.

**Universal bench-provenance halt:** any bench run without an `instruments/<id>/<version>/LOCK.md` carrying a recorded draft hash. Peek: any meter, threshold, or margin written or changed after any bench data **for that bench, from any run**, has been seen.

---

## Blind spots we already named

- Decoder-only LMs are not autoencoders. “Encoder → decoder” is the right cartoon for *vision*, not for GPT.
- Most weights are in **channel mixers (MLP / SwiGLU)**, not in the spatial mixer. Compiling a beautiful stem does not shrink the warehouse. It makes a reusable mic.
- Without a block-level meter, “forward-prop” collapses to end-task search. That is just-no.

---

## Kick off vs park

Programme verdicts: **kick off** / **park**. `closed` is a **labkit** state, not a verdict.

**One-module decision** is on **iff both** `GATE_35` (02) **and** `GATE_21` (04) are closed. Any other combination means the decision is off. Reserved handles may be closed without being declared. Revocation is another labkit act.

`v0` of 02+04 **always** uses the classical bank. If 04 is open, `v0` waits for 04’s lock (to copy \(T\) and the margins). If the one-module decision is on, 02+04 states those numbers itself. See [instruments/02plus04.md](instruments/02plus04.md).

| # | Instrument | Verdict | Doc | Gate handle (reserved, not locked) |
|---|---|---|---|---|
| 2 | Gabor / scattering stem vs learned patch+layer1 | kick off (labkit-`closed` if one-module) | [instruments/02_filterbank.md](instruments/02_filterbank.md) | `GATE_35` |
| 4 | Oscillator spatial bind, label-free | kick off (labkit-`closed` if one-module) | [instruments/04_wave_bind.md](instruments/04_wave_bind.md) | `GATE_21` |
| 5 | Designed temporal stem (HiPPO / delay bank) | kick off after GATE_34 is **decided** (`fired` or `not-fired`; a mid-run halt counts) and `instruments/02plus04/v0/LOCK.md` exists | [instruments/05_hippo_temporal.md](instruments/05_hippo_temporal.md) · explainer [HIPPO.md](HIPPO.md) | `GATE_36` |
| 2+4 | Filterbank in, wave bind, tiny readout | **kick off first via the classical-bank path** (`v0` always classical; waits on 04’s lock if 04 is open) | [instruments/02plus04.md](instruments/02plus04.md) | `GATE_34` |
| — | MLP, full attention, LM head, projector-as-physics | park | [PARK.md](PARK.md) | — |

`PARK.md` reasons *inside* park: too-large / too-weird / just-no / **capacity**.

Planned work and whether a reserved gate has *fired*: `labkit now`. Why: `labkit why <handle>`.

---

## What “done” looks like for an instrument (template)

A `instruments/<id>/<version>/LOCK.md` must name, in writing, **before any run**:

- **Spec** — what the block is *for* (invariance, horizon, bind), in units.
- **Knobs** — the handful. Not a weight tensor. **Fixed scalar values**, not ranges and not tensors (integers where the quantity is a count). Named constants (e.g. lattice 4-neighbour) count as fixed.
- **Meter** — a number the block can fail without a classifier on ImageNet. The lock states \(M_{\mathrm{match}}\) and \(M_{\mathrm{beat}}\) with \(M_{\mathrm{beat}} \ge M_{\mathrm{match}}\).
- **Halt** — abandon conditions. Text lives here; labkit only stores fired / not-fired.
- **Scar** — what is allowed to be learned, and \(P_{\max}\) as an integer. State budget as an integer (`0` if stateless).
- **Out of scope** — the warehouse.

**Stop (success)** is a subsection of Halt, not a seventh heading. Each instrument names it. Stop requires every halt not-fired.

The string “pre-written” with no adjacent number is not a spec. Until those six headings exist and are non-empty, this folder is a notebook, not a protocol.
