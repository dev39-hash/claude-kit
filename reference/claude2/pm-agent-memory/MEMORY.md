# Memory Index

- [Phase 6 work was untracked (now committed)](phase-6-work-is-untracked.md) — historical: runtime_app/ was lost once before it was committed.
- [Qt Creator is the user's build path](qt-creator-is-the-users-build-path.md) — build config belongs in the qmake project, not in shell env vars.
- [Two-machine git topology and identities](two-machine-git-topology-and-identities.md) — dev=GitHub (dev28), deploy=local git (dev27), bundle exchange, no Co-Authored-By.
- [Dev/deploy sync workflow](dev-deploy-sync-workflow.md) — bundle commands (bundle-to-deploy / bundle-from-deploy folders), the deploy-repo vs deploy-repo-backup split, 3rdparty policy; follow for every exchange.
- [Shared working conventions with deploy](shared-working-conventions-with-deploy.md) — Sonnet subagents (code-reviewer on Opus is the one exception), invoke skills explicitly, Phase 10 contract-first WP loop and its evidence rules.
- [PM agent memory mirror](pm-agent-memory-mirror.md) — memory is mirrored into `.claude/pm-agent-memory/` by the sync-memory Stop hook; edit only the real memory outside the repo.
- [Build gotchas not in repo docs](build-gotchas-not-in-repo-docs.md) — 0-byte obj/LNK1136, app_logger swallowing test output, a running app breaking two suites.
- [Owner bench test setup](owner-bench-test-setup.md) — no MC hardware; Basler + Modbus simulator bench, the owner provokes faults on purpose, a bench run never closes a gate on the cell.
- [Phase 11 runs on dev beside Phase 10](phase-11-runs-on-dev-beside-phase-10.md) — owner 2026-10-04: dev implements Phase 11 (build_packages, qpb, runtime docking rewrite); boundary, numbering, ADS-per-Qt and Eigen 3.4.0 facts.
- [Phase 11: PM may run the plan to the end](phase-11-pm-may-run-the-plan-to-the-end.md) — owner 2026-10-05: issue/review/merge WPs without asking unless an owner decision (CP rulings, freeze window, push/bundle, deletes) is needed.
- [Claude tooling: ECC subset, CLAUDE.md, hooks](claude-tooling-ecc-2026-10-14.md) — owner 2026-10-14: agent-skills gone; .claude/CLAUDE.md; AGENT.md/AGENTS.md untracked (contributor guide + module READMEs); guard hooks; code-reviewer on Opus via /review-wp; next bundle note items.
