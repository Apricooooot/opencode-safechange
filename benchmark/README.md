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

Copy the SafeChange `.opencode/` directory and `opencode.json` into
`fixtures/config-api-v1/`, or start OpenCode with an equivalent project
configuration. Give the agent the prompt in `task.json` and require analysis-only
mode.

Do not expose `expectedImpact` from `task.json` to the agent. In a serious
evaluation, the harness should provide only the `prompt` and `fixture` directory.

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

## Limitations

The answer key represents one maintainable migration plan, not every possible
implementation. This fixture measures discovery quality; it does not yet measure
patch correctness, command safety, token cost, or latency.

