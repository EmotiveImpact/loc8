# Repository-first preservation protocol

Date: 25 September 2026. This is a workflow requirement, not a guarantee against account loss, disk failure or repository deletion.

## Scope and source of truth

Keep one current implementation in the existing monorepo. Keep original research and historical artifacts under explicitly dated archives; mark superseded claims in the index rather than silently rewriting originals. The current code describes implementation; accepted product decisions describe intended behaviour; reproducible results describe what was actually tested. None substitutes for the others.

A worktree is a working location, not a second canonical product. An upstream clone is a research input, not a production dependency. An ignored directory is not included just because a commit was pushed.

## At the start of every session

Record repository, branch, HEAD and `git status --short`. Read the root and applicable nested AGENTS.md, KNOWLEDGE.md, owner status and the latest relevant handoff. Identify existing uncommitted work without reverting it. Reconcile competing versions before calling any file current.

Read the exact Expo SDK 57 documentation required by the existing AGENTS.md before application code changes. Do not introduce a framework, compiler or dependency upgrade as part of preserving research.

## During research and implementation

Write substantive decisions to tracked Markdown while working. Give every material claim a source, revision/date, evidence label, applicability limit and resulting decision or experiment. Keep negative findings and rejected approaches. Separate externally verified findings, historical reports, code inspection, tests run now, physical results and proposals.

For upstream inputs, retain the existing repository-snapshot and source-audit ledgers. Record origin, pinned commit, exact file/blob, licence and asset terms, code-versus-idea decision, allowed scope and test. Revalidate before copying code. The historical 48-row ledger is not a fresh legal clearance.

Do not bulk-vendor all 48 repositories or execute their build/install scripts merely to preserve them. For a needed input, resolve the historical abbreviated commit to a full object, recover only the selected revision, verify the inspected file object, and record any unavailable source. Keep a separately backed-up permitted source archive when reproducibility requires actual bytes; a URL alone does not guarantee future availability.

Never commit credentials, private keys, real attendee locations, identifiable crowd captures or production operational databases. Keep confidential research private. Preserve separate product/customer data even when technology is shared.

## End-of-session delivery receipt

A receipt must distinguish `LOCAL`, `COMMITTED-LOCAL`, `PUSHED-VERIFIED`, `MERGED` and `DEPLOYED`. Record:

1. Repository, branch, parent and resulting commit; changed files and purpose.
2. Exact commands run, environment/toolchain, outcomes and what was not run.
3. Evidence source and status for each implemented or proposed capability.
4. Remote read-back of the branch/commit and critical files; the PR URL, when present.
5. Remaining risks, known gaps, pending user input and the next bounded action.
6. An independently downloadable, hash-inventoried recovery pack for substantive uncommitted artifacts.

A tree or dangling commit created on GitHub is not enough: verify a durable ref points to it. A branch is not a merge. A green unit test is not a native build, device result, safety assessment or deployment.

Do not delete or clean a worktree until its required commits are reachable from the remote and its untracked/ignored work has been inspected and separately preserved where needed. Do not run `git clean`, force-reset, force-push or overwrite another session's work as a cleanup shortcut.

## Cross-conversation transfer

Pass a small relevant handoff, not an unexplained stack of archives. Include source repository/ref, accepted boundaries, current build status, exact next task, tests and exclusions. The receiving session must read its actual repo before modifying it and write back an adoption/rejection receipt. Sending the same idea to another project does not merge its code or data.

This tool session cannot post messages into arbitrary existing ChatGPT conversations. The transfer packs are ready to paste or attach there; no automatic insertion is claimed.

## Recovery limits of this particular delivery

The conversation ZIP is the byte-preserving copy of eight recovered Library artifacts. The repository change preserves the consolidated knowledge, transfer plans, reference model, recovery inventory and pinned existing research references. Refer to the publication receipt for the exact remotely written paths; do not assume every binary or original local source tree was uploaded.

The ignored upstream clones, complete standalone Command source history and complete weekly raw conversation archive were not recovered. Their absence from the recovered set is not proof that they no longer exist elsewhere. The old arena PDF is already tracked as `docs/research/arena-dossier-2026-07-21.pdf`. No background backup service or scheduled repository writer has been installed by this protocol.
