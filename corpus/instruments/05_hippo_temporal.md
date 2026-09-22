# Instrument 05 — designed temporal stem (HiPPO / delay bank)

**Status:** draft spec, not locked. Kickoff after `instruments/02plus04/v0/LOCK.md` exists **and** GATE_34 is **decided** (`fired` or `not-fired`; a mid-run halt counts). Explainer (non-normative): [../HIPPO.md](../HIPPO.md). Variant ladder lives there, not here. Lock path: `instruments/05/v0/LOCK.md`.

A warehouse variant (trained \(\Delta\), gated \(A/B/C\)) is a **new** `<id>`, park by default — not a later lock of 05.

## Idea

A compiled stem keeps the past in a **fixed state** \(x(t) \in \mathbb{R}^N\) whose \(A\) is a HiPPO formula. Timescale \(\Delta\) is a **formula of \(\theta\)**, written in the lock, and is **not a knob**. \(C\) is the scar.

This is the synth delay / analog state-space. Survival across versions is the doctrine-4 **import** test after Stop, not a score, and not a bench halt.

## Spec (must be able to fail alone)

- **First lock variant: LegT.** Window \(\theta\) in steps. **\(\theta = L\).** Other variants (FouT, LegS, LagT, ring-of-delays) are HIPPO.md, not this lock. Ring-of-delays is a 05 variant, not a 04 layout. A ring of **oscillators** is 04’s layout question.
- \(\Delta\) is **fixed by the lock’s formula \(\Delta(\theta)\)**. Not trained. Not listed as a knob. Halt if the implemented \(\Delta\) moves off that formula.
- State size \(N\) an integer cap. Horizon \(L\) an integer. Lock states **input channel count** and **output dimension** (detection: binary vs \(L\)-way — this sets \(C\)’s size vs \(P_{\max}\)).
- **Horizon bench:** **detect** an event at lag \(\ell \in \{1,\ldots,L\}\). Meter = detection-error vs lag. Not reconstruction. Not classifier accuracy. Sequential MNIST / CLIP / ImageNet are **not admissible**.
- Control / doctrine-5 object: **FIR delay line of \(N\) taps**. \(C\) and the FIR are capped at the same integer \(P_{\max}\). A length-\(L\) FIR is the **ceiling**, not a competitor.
- Learned-\(A\) competitor: learned diagonal \(A\), **same \(N\)**. Lock states the competitor’s trainable-parameter integer (covers \(B,C,\Delta\) capacity).
- Discretization **bilinear** in the first lock.

## Knobs

LegT, \(N\), \(\theta\) (\(=L\)), bilinear. Fixed scalars. Not a weight tensor. Not \(\Delta\).

## Scar

Linear \(C\), \(P_{\max}\) an integer in the lock. Not random-\(C\) in the first lock. Warehouse is doctrine 3; a variant is a new `<id>`.

## Meter

Horizon curve: frozen HiPPO-\(A\) vs learned-\(A\) vs the \(N\)-tap FIR. Lock states \(M_{\mathrm{match}}\) and \(M_{\mathrm{beat}}\) with \(M_{\mathrm{beat}} \ge M_{\mathrm{match}}\). The \(N\)-tap FIR **is** the doctrine-5 control. Ties are Halt.

## Halt

- Halt: frozen-\(A\)+\(C\) does not beat the \(N\)-tap FIR by \(M_{\mathrm{beat}}\) on the lag curve. (Doctrine 5: FIR matches or beats the stem.)
- Halt: frozen-\(A\)+\(C\) does not beat learned-\(A\) by \(M_{\mathrm{beat}}\) on the lag curve. (Ties are Halt. This is the “failed in writing” record for a warehouse variant as a **new** `<id>`.)
- Halt (doctrine 3): \(A\), \(B\), or \(\Delta\) receiving gradient from **any** loss, including this bench’s; or any input-dependent gate on \(A,B,\Delta\) or on \(C\).
- Halt: any gradient from a loss outside this bench (including CLIP cosine, sequential MNIST, a projector).
- Halt: implemented \(\Delta\) moved off the lock’s formula \(\Delta(\theta)\).
- Halt: scar exceeds \(P_{\max}\), or state exceeds \(N\) (or channels \(\times N\), as the lock’s input-channel count states).
- Halt: any bench run without `instruments/05/<version>/LOCK.md` carrying a recorded draft hash.
- Halt: any meter, threshold, or margin written or changed after any bench data for that bench, from any run, has been seen.

Classifier wins are not a halt and not a success. They are out of court.

**Stop (success):** every halt not-fired, including frozen-\(A\)+\(C\) beating the \(N\)-tap FIR **and** learned-\(A\) by \(M_{\mathrm{beat}}\) → freeze the stem and stop. Any outcome that does not meet Stop is a halt.

## Out of scope

Replacing the LM. Selective SSMs as the first artefact. Fusing 05 with 04 in the first lock. **Tuning any knob on any data.**

## Note on Muller 2026

[Explicit operator / S4D on a ring](https://arxiv.org/abs/2604.20595) is an *interpretation* of 05-shaped objects as traveling waves. 05’s bench does not require a ring. A ring of **oscillators** is 04’s layout question, and 04 **forbids it inside 02+04**. Ring-of-delays is a 05 variant, not a layout.
