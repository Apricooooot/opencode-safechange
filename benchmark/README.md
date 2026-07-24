# SafeChange benchmark

This benchmark evaluates impact discovery rather than code-generation style.
The first fixture models a public API migration that crosses runtime code, tests,
documentation, and an indirect behavioral dependency.

## Task

The fixture application exposes:

```js
parseConfig(path)
```

The requested migration is:

```js
parseConfig({ path, env, defaults })
```

Existing string callers must continue to work during a compatibility window.
The agent should identify all affected files before editing.

## Run an agent

Prepare an isolated run directory:

```bash
npm run benchmark:prepare
```

This creates `work/opencode-safechange-benchmark/config-api-options-v1/` beside
the repository's `outputs/` directory. The location is outside the source
repository's parent Git worktree and contains only the fixture, SafeChange
runtime configuration, and a prompt file. It intentionally does not copy
`task.json`, `sample-prediction.json`, the evaluator, or any answer key into the
agent's worktree.

On Windows, run the end-to-end command:

```powershell
powershell -ExecutionPolicy Bypass -File benchmark/run-opencode.ps1 `
  -Model openai/gpt-5.6-sol `
  -Variant high
```

The script verifies that OpenCode is authenticated, rebuilds and initializes the
isolated directory as its own Git worktree, and stores raw JSON events under the
source repository's ignored `.benchmark-runs/results/`. It never copies
credentials into the run directory.

The isolated run installs a benchmark-only structured-output tool. The agent
submits its prediction through that tool instead of relying on JSON embedded in
the prose response. The runner then copies the prediction into the ignored
results directory and scores it automatically.

Normalize the agent's findings to:

```json
{
  "taskId": "config-api-options-v1",
  "findings": [
    {
      "file": "src/config.js",
      "classification": "direct",
      "evidence": "Declares parseConfig(path)."
    }
  ]
}
```

Paths are relative to the fixture root and use `/` separators.

A successful run prints paths for the raw events, reproducibility metadata,
normalized prediction, and evaluator score. Model output and evidence should
still be reviewed alongside the numeric score.

## Score

```bash
node benchmark/evaluate.js prediction.json
```

Metrics:

- precision: predicted impacted files that are in the answer key;
- recall: expected impacted files discovered by the agent;
- F1: harmonic mean of precision and recall;
- classification accuracy: correct direct, indirect, or validation label;
- evidence coverage: matched findings containing non-empty evidence;
- overall: `50% F1 + 30% classification + 20% evidence`.

The evaluator exits with code 2 when the prediction is malformed and code 1 when
`--min-score` is supplied and the score is below the threshold.

## Result provenance

Published results should record:

- OpenCode version;
- provider and exact model ID;
- model variant/reasoning effort;
- SafeChange commit SHA;
- task ID;
- UTC timestamp;
- raw OpenCode JSONL output;
- normalized prediction and evaluator result.

Do not commit OAuth credentials, API keys, `auth.json`, or the generated isolated
worktree. Raw JSONL may contain runtime/session metadata; keep it local unless it
has been reviewed and sanitized. A sanitized example result is available under
[`benchmark/results/`](results/).

## Limitations

The answer key represents one maintainable migration plan, not every possible
implementation. This fixture measures discovery quality; it does not yet measure
patch correctness, command safety, token cost, or latency.
