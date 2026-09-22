# HiPPO — the designed delay (plain)

**Status:** explainer for [instruments/05_hippo_temporal.md](instruments/05_hippo_temporal.md). **Not a lock. Not normative.** 05 is the instrument. Warehouse vs scar is [DESIGN.md](DESIGN.md) doctrine 3; this file does not keep a second list.

Papers: [HiPPO](https://arxiv.org/abs/2008.07669) (Gu, Dao, Ermon, Rudra, Ré, 2020) → [S4](https://arxiv.org/abs/2111.00396) → [How to Train Your HiPPO](https://arxiv.org/abs/2206.12037) → [S4D](https://arxiv.org/abs/2206.11893).

---

## What it is

Memory as a **math problem**, not a learned table:

> Compress the history of a signal \(u(t)\) *online* into a short vector \(x(t)\), so you can reconstruct the past that still matters.

“What still matters” is a **measure** on the past. Pick an orthogonal polynomial basis. The coefficients obey

\[
\dot x(t) = A x(t) + B u(t), \qquad y = C x.
\]

\(A\) and \(B\) are **formulas**. \(C\) is the scar (05 first lock: linear \(C\)). Input-dependent \(B,C,\Delta\) is warehouse (doctrine 3). A warehouse variant is a **new** `<id>`, park by default.

HiPPO = **Hi**gh-order **P**olynomial **P**rojection **O**perators. A handful of numbers: \(N\), the variant, the timescale \(\Delta\).

---

## The variants (pick with the spec, not with a vibe)

05’s first lock is **LegT only**, with \(\theta = L\). This table is background.

| Name | Past that matters | Basis | Use as stem when |
|---|---|---|---|
| **LegS** | all history, scale-invariant (exponential *warp* of the time axis) | Legendre on a stretched axis | you do not want to guess a window |
| **LegT** | sliding window of length \(\theta\) | Legendre on \([t-\theta, t]\) | you *do* have a horizon. **05 first lock.** |
| **LagT** | exponential fade of weight | Laguerre | GRU-shaped memory; not first |
| **FouT** | sliding window, Fourier | sines/cosines | filterbank-in-time; kernel length \(= 1/\Delta\) |
| ring-of-delays | discrete taps on a ring | — | a **05 variant**, not a 04 layout. A ring of *oscillators* is 04’s layout question. |

S4-LegS orthogonalizes the input against a scale-invariant measure over all history. Do not confuse this with LagT’s exponential fade.

\(\Delta\) is written from the spec’s horizon as a **formula of \(\theta\)**. 05 does not list \(\Delta\) as a knob. Training \(\Delta\) is warehouse: a new `<id>`, only after frozen-\(A\) has failed 05 in writing.

---

## What S4 added (so we do not re-litigate it)

S4 writes \(A\) as diagonal-plus-low-rank. S4D drops to a complex diagonal \(A\). **LinOSS / D-LinOSS** are the explicit oscillator write of the same idea.

For a **frozen stem**: \(A,B\) from LegT; \(\Delta(\theta)\) as a formula; linear \(C\); no warehouse until 05 fails in writing.

---

## Why this is “compile,” not “train a blob”

LSSL reported random \(A\) ~60% vs HiPPO \(A\) ~98% on **sequential MNIST accuracy**. That is **history only**. Under 05’s halt that number is **not admissible**; the lag curve is.

Muller/Liboni 2026 ([arXiv:2604.20595](https://arxiv.org/abs/2604.20595)) interpret S4D as a ring of oscillators with traveling waves. **05 is a delay, 04 is a bind.** Do not fuse them in prose.

---

## Mini-project shape (still unlocked)

See [instruments/05_hippo_temporal.md](instruments/05_hippo_temporal.md). The only question 05 is allowed to ask:

> Does a frozen HiPPO-\(A\) (LegT, \(\Delta(\theta)\) from spec) beat a learned temporal stem **and an \(N\)-tap FIR**, of the same state size, **on a horizon detection bench**, not on a classifier?

If learned \(A\) wins only on end-task, that is not a win. That is soup.
