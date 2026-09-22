# Instrument 04 — traveling-wave spatial bind (label-free)

**Status:** draft spec, not locked. Kickoff candidate. (Labkit-`closed` if the one-module decision is on — echo only.) Lock path: `instruments/04/v0/LOCK.md`.

This is the Bonsai / overlap_bench / Muller wave, **without a class-conditioned T and without a mask.**

## Idea

Local features in. A population trajectory that has bound “what belongs together” after time \(T\). No class label in the graph. The wave is the mixer. A readout may *report* the bind; it may not *be* the bind.

**04 is a spatial bind on a layout.** Michigan 2025 ([2507.13638v1](https://arxiv.org/abs/2507.13638)) is **background, not precedent for 04’s meter**. Muller/Liboni’s ring of **oscillators** is a legal *layout family* for **04-alone later work**, not the meter, and **not** legal inside 02+04. Ring-of-delays is a 05 variant, not a layout.

Addressable-transients Arc 1: snapshot \(J(t_0)\) was enough at those locks. 04 does not reopen that control question.

## Spec (must be able to fail alone)

- **Input, named in the lock, with the hash of the upstream artefact.** If 02 is labkit-`closed` **or open**: named frozen substitute (Gabor energy; classical-bank params are minted by 02+04 / this lock, see LOCKS.md). If 02 has **frozen** (Stop recorded as a labkit act): 02 bank energy including a frozen 1×1 mix if one exists. The lock does not change input after lock time.
- **Controls named by a composing module (02+04) are exempt from this input clause.**
- **Meter (one):** **adjusted Rand index (ARI)** on pixel assignment to two blob ids, after \(T\), synthetic overlapping blobs, **no mask**. **Overlap pixels are excluded** from ARI. Not reconstruction. Not denoising. Lock states \(T\), \(M_{\mathrm{match}}\), \(M_{\mathrm{beat}}\) with \(M_{\mathrm{beat}} \ge M_{\mathrm{match}}\).
- **Label-free:** no class id in \(W\).
- **Layout:** lattice is the first lock and the only layout legal **inside 02+04**. Lock writes **grid size, 4- or 8-neighbour, boundary** as integers or named constants. Ring / kNN-on-features / estimated \(W\) are 04-alone later work.
- **No mask.** No delay (DESIGN.md: explicit delay element or buffered state not arising from nearest-neighbour coupling). Coupling scale is a knob.

## Knobs

Lattice (grid, neighbourhood, boundary — named constants), coupling scale (fixed scalar), \(T\), state size (live channels × nodes). Not a per-image trained net. Not delay.

## Scar

**Linear** readout, \(P_{\max}\) an integer in the lock, trained on the bind bench only. Tiny MLP is not the first lock.

\(P_{\mathrm{frozen\_inherit}}\): integer, `0` unless 02’s mix is used; own halt.

## Meter

ARI on pixel assignment to two blob ids, overlap excluded, no mask. The **control readout is the same architecture and size cap as the scar**, trained on the same bench, applied to the input energy.

## Halt

- Halt: wave+readout does not beat the control by \(M_{\mathrm{beat}}\) on ARI. (Ties are Halt. Doctrine 5: control matches or beats the instrument.)
- Halt: graph estimated with labels in the room.
- Halt (doctrine 3): any blueprint parameter (\(W\), coupling) receiving gradient from **any** loss, including this bench’s; or any input-dependent gate on a blueprint parameter or on the scar readout.
- Halt: any gradient from a loss outside this bench.
- Halt: scar exceeds \(P_{\max}\); or \(P_{\mathrm{frozen\_inherit}}\) exceeds its lock integer; or total state exceeds the budget; or an explicit delay element / buffered state not arising from nearest-neighbour coupling is present.
- Halt: any bench run without `instruments/04/<version>/LOCK.md` carrying a recorded draft hash.
- Halt: any meter, threshold, or margin written or changed after any bench data for that bench, from any run, has been seen.

**Stop (success):** every halt not-fired, including wave+readout beating the control by \(M_{\mathrm{beat}}\) → freeze 04 and stop. End-task scores are not admissible. Any outcome that does not meet Stop is a halt.

## Out of scope

Jacobian inverse, switchboard controllability, CIFAR-10 “because we are bored,” class-0 topology from Bonsai T, denoising-as-meter, fusing delay into the bind. **Tuning any knob on any data.**

## Honest inheritance

- overlap_bench: learned long-range \(K_2\) helped; mask was doing segmentation. Mask is gone. 04 must work without it or admit chance.
- Bonsai T: class-conditioned graph. 04 forbids that.
- Muller cv-NN: closed-form waves; we may steal a *layout family* of oscillators for 04-alone later work, not their task, and not inside 02+04.
