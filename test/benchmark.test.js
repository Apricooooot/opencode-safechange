import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

import { evaluate } from "../benchmark/evaluate.js"

const task = JSON.parse(
  await readFile(new URL("../benchmark/task.json", import.meta.url), "utf8"),
)
const sample = JSON.parse(
  await readFile(
    new URL("../benchmark/sample-prediction.json", import.meta.url),
    "utf8",
  ),
)

test("complete evidence-backed prediction earns a perfect score", () => {
  const result = evaluate(task, sample)

  assert.equal(result.metrics.overall, 1)
  assert.deepEqual(result.missedFiles, [])
  assert.deepEqual(result.unexpectedFiles, [])
})

test("missed and unexpected files affect recall and precision", () => {
  const prediction = {
    taskId: task.id,
    findings: [
      {
        file: "src/config.js",
        classification: "direct",
        evidence: "declares the API",
      },
      {
        file: "package.json",
        classification: "indirect",
        evidence: "incorrect guess",
      },
    ],
  }

  const result = evaluate(task, prediction)

  assert.equal(result.counts.truePositives, 1)
  assert.equal(result.counts.falsePositives, 1)
  assert.equal(result.counts.falseNegatives, 6)
  assert.equal(result.metrics.precision, 0.5)
  assert.equal(result.metrics.recall, 0.143)
})

test("invalid and duplicate findings are rejected", () => {
  assert.throws(
    () =>
      evaluate(task, {
        taskId: task.id,
        findings: [
          {
            file: "src/config.js",
            classification: "direct",
            evidence: "first",
          },
          {
            file: "src/config.js",
            classification: "direct",
            evidence: "duplicate",
          },
        ],
      }),
    /duplicate finding/,
  )
})
