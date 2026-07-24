import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

test("preparation script excludes benchmark answer-key artifacts", async () => {
  const source = await readFile(
    new URL("../benchmark/prepare-run.js", import.meta.url),
    "utf8",
  )

  assert.match(source, /task\.prompt/)
  assert.match(source, /workspaceRoot/)
  assert.match(source, /opencode-safechange-benchmark/)
  assert.doesNotMatch(source, /expectedImpact/)
  assert.doesNotMatch(source, /sample-prediction/)
  assert.doesNotMatch(source, /evaluate\.js/)
})

test("runner records reproducibility metadata without credentials", async () => {
  const source = await readFile(
    new URL("../benchmark/run-opencode.ps1", import.meta.url),
    "utf8",
  )

  assert.match(source, /openCodeVersion/)
  assert.match(source, /safeChangeCommit/)
  assert.match(source, /variant/)
  assert.match(source, /authExitCode/)
  assert.match(source, /runExitCode/)
  assert.match(source, /taskId = \$Task/)
  assert.match(source, /prepare-run\.js'\) \$Task/)
  assert.match(source, /prediction\.json/)
  assert.match(source, /evaluate\.js/)
  assert.match(source, /git -C \$runDirectory init/)
  assert.doesNotMatch(source, /auth\.json/)
})

test("preparation selects a task without copying its answer key", async () => {
  const source = await readFile(
    new URL("../benchmark/prepare-run.js", import.meta.url),
    "utf8",
  )

  assert.match(source, /requestedTaskId/)
  assert.match(source, /tasks/)
  assert.match(source, /task\.fixture/)
  assert.doesNotMatch(source, /task\.expectedImpact/)
})

test("primary agent cannot edit and only permits read-only Git commands", async () => {
  const source = await readFile(
    new URL("../.opencode/agents/safechange.md", import.meta.url),
    "utf8",
  )

  assert.match(source, /edit: deny/)
  assert.match(source, /"git status\*": allow/)
  assert.match(source, /"git diff\*": allow/)
  assert.match(source, /"git ls-files\*": allow/)
  assert.match(source, /"\*": deny/)
})

test("primary agent preserves explicit machine-readable output contracts", async () => {
  const source = await readFile(
    new URL("../.opencode/agents/safechange.md", import.meta.url),
    "utf8",
  )

  assert.match(source, /machine-readable output contract/)
  assert.match(source, /absolute end of the final response/)
})

test("benchmark preparation installs a structured prediction tool", async () => {
  const source = await readFile(
    new URL("../benchmark/prepare-run.js", import.meta.url),
    "utf8",
  )

  assert.match(source, /benchmark-prediction\.ts/)
  assert.match(source, /benchmark-prediction tool exactly/)
  assert.match(source, /classification/)
})
