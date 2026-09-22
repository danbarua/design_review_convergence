# Parked — do not start

These sockets failed the “has a component spec” test, or they *are* the product, or they wait on capacity. Forward-prop here is training a model under another name.

In [DESIGN.md](DESIGN.md) terms, everything on this page is **park**. Reasons *inside* park (not extra programme states):

- **too-large** — the spec *is* the whole task.
- **too-weird** — no block-level failure criterion that is not the product.
- **just-no** — wrong object, or compile will not survive contact with the job.
- **capacity** — a spec exists; this programme is not scheduling it.

| Socket | Why | Reason |
|---|---|---|
| Channel mixer (MLP / SwiGLU) | Shape is expand 4×, gate, contract. Not a spec. Bulk of the warehouse. | too-large |
| Unconstrained global attention | Any token may need any other. That is the task, not a block. | too-large |
| LM head / next-token core | The product. | too-large |
| Vision→LM projector as physics | No failure criterion that is not the whole VLM. A small learned map is honest **warehouse**; it is not a scar, because it has no bench of its own. A Kuramoto ring is not a plan. | too-weird |
| Embedding table | A dictionary. Reuse is a library problem. | just-no |
| RMSNorm, residuals | Plumbing. | just-no |
| RLHF / preference | No instrument. | just-no |
| Softmax attention at GPT width, analog-compiled | A worse GPU. | just-no |
| Tokenizer-as-oscillator | BPE already is not backprop. Leave it. | just-no |
| Delay+index / induction-head machine (copy-from-here, state-size cap, horizon cap) | Spec exists. Hybrid-compile is possible. No instrument number. Revisit after `instruments/02plus04/v0/LOCK.md` exists and GATE_34 is decided. | capacity |
| Warehouse variant of 05 (trained \(\Delta\), gated \(A/B/C\)) | New `<id>` if 05 fails in writing. Park by default. | capacity |

If a future lock wants one of the table rows, it must write a spec that can fail *without* a foundation-model loss. Until then: parked.
