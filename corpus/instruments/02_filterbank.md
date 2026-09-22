# Instrument 02 — local oriented filterbank

**Status:** draft spec, not locked. Kickoff candidate. (Labkit-`closed` if the one-module decision is on — echo only.) Pair: [02plus04](02plus04.md). Lock path: `instruments/02/v0/LOCK.md`.

## Idea

The first spatial layer of a vision tower is, empirically, a bag of oriented bandpass filters. That is V1-simple. Gabor, steerable pyramids, and Mallat’s scattering transform are **compiled** versions. A learned patch-embed + layer-1 that wins only on ImageNet is soup wearing a Gabor coat.

## Spec (must be able to fail alone)

- Bandpass in **orientation × scale**. Lock names integers (not ranges). Draft default if someone insists on running 02 alone: 8 orientations, 4 scales, **quadrature** pair per cell. (Quadrature is required so “energy-in-correct-band” is defined; cosine-only is not the first lock.)
- Known impulse response (plottable).
- **Meter:** energy in the correct orientation×scale band on a synthetic grating / edge, under small translation, rotation, and scale. Lock states \(\varepsilon\), \(\varepsilon_{\mathrm{shift}}\), \(\varepsilon_E\). Not reconstruction. Not classification.
- State budget: `0` (stateless). Halt if state exceeds `0`.
- Lock states **output channel count** as an integer, and whether it is measured **before or after** a mix.
- Lock **pre-assigns channels to (orientation, scale)** targets so a free conv has a defined “correct band.”
- Spatial budget of the competitor: same number of output channels and the same kernel spatial support. Lock states the competitor’s trainable-parameter integer.

02 owns local geometry. kNN / estimated \(W\) inside 04 is not a way to re-derive that geometry in the combined module.

## Knobs

Aperture / patch size, \(n_{\mathrm{ori}}\), \(n_{\mathrm{scale}}\), bandwidth. Fixed scalars. Quadrature on. **Not** a \(C_{out} \times C_{in} \times k \times k\) tensor. Tuning any knob on any data is out of scope.

## Scar

None required. Allowed: a linear 1×1 mix of filter channels, \(P_{\max}\) an integer in the lock, trained on the invariance bench only.

The mix is a **readout of 02’s bench only**. In any composed module it is a **frozen blueprint layer**, not a scar, counted as \(P_{\mathrm{frozen\_inherit}}\) there.

## Meter

Energy-in-correct-band vs a learned first conv / ViT patch+layer-1 of the same spatial budget, on the invariance bench, under the lock’s channel-to-band assignment.

**Competitor loss:** trained on the same energy-in-correct-band objective, on the same synthetic gratings, under that assignment. Halt if the free conv beats the frozen bank by \(M_{\mathrm{beat}}\). Ties are Halt.

Lock states \(M_{\mathrm{match}}\) and \(M_{\mathrm{beat}}\) with \(M_{\mathrm{beat}} \ge M_{\mathrm{match}}\).

## Halt

- Halt: the frozen bank does not beat the learned first conv / patch+layer-1 by \(M_{\mathrm{beat}}\) on the invariance bench. (Ties are Halt. This is also the “failed in writing” record for a warehouse variant as a **new** `<id>`.)
- Halt (doctrine 5): a linear map with \(P_{\max}\) of the mix (if a mix exists) or \(P_{\max}^{\mathrm{ctrl}}\) (if no scar) **on raw patches** matches or beats the bank within \(M_{\mathrm{match}}\).
- Halt: measured error exceeds \(\varepsilon\), \(\varepsilon_{\mathrm{shift}}\), or \(\varepsilon_E\).
- Halt (doctrine 3): any blueprint parameter (the filter set) receiving gradient from **any** loss, including this bench’s; or any input-dependent gate on a blueprint parameter or on the scar readout.
- Halt: any gradient from a loss outside this bench (including ImageNet, CLIP, a projector).
- Halt: trained scar exceeds \(P_{\max}\), or state exceeds `0`.
- Halt: any bench run without `instruments/02/<version>/LOCK.md` carrying a recorded draft hash.
- Halt: any meter, threshold, or margin written or changed after any bench data for that bench, from any run, has been seen.

**Stop (success):** every halt not-fired, including the bank beating the learned conv by \(M_{\mathrm{beat}}\) and \(\varepsilon, \varepsilon_{\mathrm{shift}}, \varepsilon_E\) holding → compile the bank and stop. End-task scores are not admissible. Any outcome that does not meet Stop is a halt.

## Out of scope

Binding (04). Temporal memory (05). Classifier heads. CIFAR as identity. **Tuning any knob on any data.**
