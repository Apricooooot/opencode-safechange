#!/usr/bin/env node

import { readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const benchmarkDirectory = dirname(fileURLToPath(import.meta.url))

function taskPathFor(taskId) {
  return taskId === "config-api-options-v1"
    ? resolve(benchmarkDirectory, "task.json")
    : resolve(benchmarkDirectory, "tasks", `${taskId}.json`)
}

function round(value) {
  return Math.round(value * 1000) / 1000
}

function fail(message) {
  console.error(`benchmark error: ${message}`)
  process.exitCode = 2
}

export function evaluate(task, prediction) {
  if (prediction.taskId !== task.id) {
    throw new TypeError(
      `prediction taskId "${prediction.taskId}" does not match "${task.id}"`,
    )
  }
  if (!Array.isArray(prediction.findings)) {
    throw new TypeError("prediction.findings must be an array")
  }

  const allowedClassifications = new Set([
    "direct",
    "indirect",
    "validation",
  ])
  const predicted = new Map()

  for (const finding of prediction.findings) {
    if (!finding?.file || typeof finding.file !== "string") {
      throw new TypeError("every finding requires a string file")
    }
    if (!allowedClassifications.has(finding.classification)) {
      throw new TypeError(
        `${finding.file} has invalid classification "${finding.classification}"`,
      )
    }
    if (finding.file.includes("\\") || finding.file.startsWith("/")) {
      throw new TypeError(`${finding.file} must be a relative POSIX path`)
    }
    if (predicted.has(finding.file)) {
      throw new TypeError(`duplicate finding: ${finding.file}`)
    }
    predicted.set(finding.file, finding)
  }

  const expected = new Map(
    task.expectedImpact.map((finding) => [finding.file, finding]),
  )
  const matched = [...predicted.keys()].filter((file) => expected.has(file))
  const truePositives = matched.length
  const falsePositives = predicted.size - truePositives
  const falseNegatives = expected.size - truePositives
  const precision = predicted.size ? truePositives / predicted.size : 0
  const recall = expected.size ? truePositives / expected.size : 0
  const f1 =
    precision + recall ? (2 * precision * recall) / (precision + recall) : 0
  const correctClassifications = matched.filter(
    (file) =>
      predicted.get(file).classification === expected.get(file).classification,
  ).length
  const classificationAccuracy = truePositives
    ? correctClassifications / truePositives
    : 0
  const findingsWithEvidence = matched.filter(
    (file) => predicted.get(file).evidence?.trim().length > 0,
  ).length
  const evidenceCoverage = truePositives
    ? findingsWithEvidence / truePositives
    : 0
  const overall =
    0.5 * f1 + 0.3 * classificationAccuracy + 0.2 * evidenceCoverage

  return {
    taskId: task.id,
    counts: {
      expected: expected.size,
      predicted: predicted.size,
      truePositives,
      falsePositives,
      falseNegatives,
    },
    metrics: {
      precision: round(precision),
      recall: round(recall),
      f1: round(f1),
      classificationAccuracy: round(classificationAccuracy),
      evidenceCoverage: round(evidenceCoverage),
      overall: round(overall),
    },
    missedFiles: [...expected.keys()].filter((file) => !predicted.has(file)),
    unexpectedFiles: [...predicted.keys()].filter((file) => !expected.has(file)),
  }
}

async function main() {
  const predictionPath = process.argv[2]
  if (!predictionPath) {
    fail("usage: node benchmark/evaluate.js <prediction.json> [--min-score N]")
    return
  }

  const minimumIndex = process.argv.indexOf("--min-score")
  const minimum =
    minimumIndex === -1 ? null : Number(process.argv[minimumIndex + 1])
  if (minimum !== null && (!Number.isFinite(minimum) || minimum < 0 || minimum > 1)) {
    fail("--min-score must be a number between 0 and 1")
    return
  }

  try {
    const prediction = await readFile(resolve(predictionPath), "utf8").then(
      JSON.parse,
    )
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(prediction.taskId ?? "")) {
      throw new TypeError("prediction taskId is invalid")
    }
    const task = await readFile(taskPathFor(prediction.taskId), "utf8").then(
      JSON.parse,
    )
    const result = evaluate(task, prediction)
    console.log(JSON.stringify(result, null, 2))
    if (minimum !== null && result.metrics.overall < minimum) {
      process.exitCode = 1
    }
  } catch (error) {
    fail(error.message)
  }
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await main()
}
