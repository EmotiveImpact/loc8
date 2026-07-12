# GUARDBACKUP — frozen snapshot, not live code

This folder is a **verbatim snapshot of the branch `claude/vibrant-yalow-620cd6`
at its final commit `4f725df`** (2026-07-10) — the "vibrant-yalow" session's
Guard build: the Guard app under `apps/guard`, the engine floor system
(FloorTracker / floorMath / floorService), hold-to-arm SOS + HoldButton,
ops haptics, and the session's docs state.

**Nothing here is meant to be edited or imported.** The branch was already
merged into main (merge commit `c157fea`, 2026-07-12, "lift the dedicated
Guard build, combined SOS UX"), so main's `apps/guard` + `packages/engine`
are the living versions — this copy exists only as an easy-to-browse safety
archive at the repo owner's request.

To compare something in here against the live code:

```bash
diff -r GUARDBACKUP/apps/guard apps/guard
git log --oneline claude/vibrant-yalow-620cd6   # the original history, still in git
```

If the branch ref is ever deleted, this folder (and merge commit `c157fea`)
still preserve the work.
