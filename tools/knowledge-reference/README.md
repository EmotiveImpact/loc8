# Synthetic continuity reference

Run `node --test tools/knowledge-reference/contracts.test.mjs` from the repository root.

This dependency-free reference demonstrates observation age versus arrival and separately scoped delivery evidence. It is not imported by any application. It does not authenticate a sender, store operational data, parse radio packets, choose routes or implement courier delivery. Its `authorised`, `sourceClockTrusted` and `verifiedOrigin` fields are assertions supplied by a synthetic caller; production requires real authority, clock and receipt validation.

The 15-second/60-second test thresholds are test fixtures, not accepted product thresholds or a radio SLA. The example returns no coordinates and cannot be used as a location store. It deliberately does not solve out-of-order observation admission, source identity, permission expiry or wire migration; those belong to the existing host contracts and Pack A/B acceptance gates.

The delivery reference records independent facts, not an automatically advanced command state. It does not infer lower-level receipts from a human acknowledgement or completed action from any receipt. It has no failure/timeout/cancellation or bounded-retention implementation; do not use it as the production outbox or incident state machine. Use its invariants to strengthen existing code and delete duplication during integration.
