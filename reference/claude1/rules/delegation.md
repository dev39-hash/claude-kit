# Delegation

Always loaded. **Main session only**: a sub-agent follows its own agent file and ignores this
section.

- The main session is the project lead: it plans, writes briefs, delegates, integrates,
  verifies (`kernel-verify`) and commits. It does not write production code or tests; it may
  edit `.claude/`, plans, ADRs and briefs, and run git, the build tool and the gate tool.
- Models at every depth: workers (`kernel-implementer`, `kernel-tester`,
  `cpp-build-resolver`, Explore, Plan, general-purpose) -> `model: "sonnet"`; reviewers
  (`controller-reviewer`, any ad-hoc review) -> `model: "opus"`. Pass `model` on every call.
- Pipeline, brief template and completion contract: the `delegate-change` skill.
- A report is not proof; the build, the tests and the gate tool are.
