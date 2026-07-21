# Research archive

Primary research output, preserved verbatim. **Do not delete these** — they are
the evidence behind specification numbers, and re-running the research costs
millions of tokens and hours.

## Arena connectivity / anchor radio reality (2026-07-21)

External research (ChatGPT, un-briefed on the product) + our verification pass.

| File | What it is |
|---|---|
| [arena-dossier-assessment.md](arena-dossier-assessment.md) | **Start here.** Adopt/adapt/reject verdicts, independently verified claims, the uplink/downlink lesson, and where every adopted item landed in the specs. |
| [arena-dossier-2026-07-21.pdf](arena-dossier-2026-07-21.pdf) | The 29-page dossier, archived verbatim. |

Outcome: anchor cost £30–40 → £60–75 (ears-not-mouths reframe), uplink-planned
spacing, the gate ① field-test protocol, acceptance criteria, compliance map,
and rotating pseudonyms added to gate ④ scope. `../BRIEFING-FOR-AI.md` exists
so future external research starts correctly briefed.

## Patent prior-art (2026-07-20)

See [patent-prior-art-report.md](patent-prior-art-report.md) — all three
candidates failed adversarial verification; no drafting spend supported. Freed
the decks from confidentiality constraints.

## Gateway battery & power (2026-07-20)

132-agent adversarial research workflow · 1,875 tool calls · 6.97M tokens.
Source for `../hardware/loc8-gateway.md` §9.

| File | What it is |
|---|---|
| [gateway-battery-synthesis.md](gateway-battery-synthesis.md) | **Start here.** The full consolidated recommendation: float-vs-cycle behaviour, LFP choice, pack sizing and runtime arithmetic, the UPS-board survey, the PoE-switch problem, load-shedding + shutdown ladder, compliance, and the bench-measurement list. |
| [gateway-battery-corrections.md](gateway-battery-corrections.md) | **The audit trail.** All 123 first-pass claims that adversarial verification overturned, each with the corrected version and the full reasoning. If you ever wonder "why does the spec say X and not Y", the answer is almost certainly in here. |
| [gateway-battery-raw.json](gateway-battery-raw.json) | The workflow's complete return value, unmodified — synthesis, corrections, progress log. Machine-readable source of the two files above. |

**Of ~124 first-pass claims, 123 were corrected before reaching the spec.** That
ratio is not a failure — it is the verification layer doing its job. Research
agents state things loosely; the adversarial pass tightens or refutes them. Any
number in §9 that looks oddly specific is specific *because* of this pass.

### What is not here

The per-agent raw transcripts (each agent's tool-by-tool session) were lost to a
disk-space cleanup on 2026-07-20 before being archived. The *findings* survived
because the workflow's return value was written elsewhere; only the intermediate
reasoning of individual agents is gone. **Lesson: archive research output into
the repo at the moment it completes, not later** — anything living only in a
session or temp directory is one cleanup away from gone.
