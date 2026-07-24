# OpenCode SafeChange

A risk-aware multi-agent runtime for dependency upgrades, public API changes,
schema migrations, and cross-module refactors.

SafeChange focuses on the hard part of repository change: discovering what can
break, bounding the implementation, and producing evidence that the result was
verified.

## Why SafeChange?

General coding agents optimize for producing a patch. SafeChange uses an explicit
lifecycle and permission-separated agents to answer four different questions:

1. What is affected?
2. In what order should it change?
3. What is the smallest safe implementation?
4. What evidence shows that it works?

## Architecture

- `safechange`: primary agent and lifecycle orchestrator
- `impact-analyzer`: read-only repository mapper and impact investigator
- `implementer-verifier`: scoped editor and test runner
- `safechange_report`: custom tool that writes an auditable JSON report
- deterministic state machine with tests

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design.

## Install

Prerequisites:

- OpenCode
- Node.js 20 or newer for the deterministic runtime tests

Copy these project components into the repository you want to analyze:

```text
.opencode/
opencode.json
```

Alternatively, clone SafeChange and use it as a reference configuration.
OpenCode discovers project agents from `.opencode/agents/` and tools from
`.opencode/tools/`.

## Usage

Start OpenCode in the target repository and select the `safechange` primary
agent. Begin with a read-only request:

```text
Analyze upgrading pydantic from v1 to v2. Find affected code, tests,
configuration, CI, and documentation. Produce a migration and rollback plan.
Do not edit files.
```

Review the evidence and plan. If it is correct, explicitly approve application:

```text
Apply the approved plan, run the proposed checks, inspect the diff, and write
the final SafeChange report.
```

The structured report is written to `.safechange/report.json` and is ignored by
Git by default.

More prompts are available in [`examples/`](examples/).

## Lifecycle

```text
INTAKE -> ANALYZING -> PLANNED -> APPLYING -> VERIFYING -> COMPLETED
                  \          \          \              \
                   -------------------------------------> FAILED
```

Analysis-only runs can complete from `PLANNED`. Implementation cannot begin
before analysis and planning.

## Validate the runtime

```bash
npm run check
```

The tests use Node's built-in test runner and require no package installation.

## Current scope

Version 0.1 is intentionally small:

- evidence-backed impact analysis;
- approval-gated implementation;
- focused and repository-level verification;
- machine-readable reports;
- explicit lifecycle tests.

Planned work includes benchmark fixtures, report schema validation, a GitHub
Actions integration, and cross-run evaluation metrics.

## Safety

SafeChange is a control pattern, not a security sandbox. Use it on a branch or
disposable worktree and review every diff. See [SECURITY.md](SECURITY.md).

## License

MIT
