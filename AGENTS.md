# SafeChange development guide

SafeChange is an OpenCode multi-agent runtime for risk-aware repository changes.

## Commands

- Run validation with `npm run check`.
- Run unit tests with `npm test`.

## Architecture

- `.opencode/agents/` contains the primary agent and two subagents.
- `.opencode/tools/` contains the structured report tool exposed to OpenCode.
- `runtime/` contains deterministic runtime primitives that can be tested without an LLM.
- `examples/` contains prompts that demonstrate the intended workflow.

Keep analysis read-only. File edits belong to the implementer-verifier and require
the primary agent to have entered APPLYING state.

