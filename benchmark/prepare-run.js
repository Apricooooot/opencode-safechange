#!/usr/bin/env node

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const benchmarkDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(benchmarkDirectory, "..")
const workspaceRoot = resolve(repositoryRoot, "..", "..")
const requestedTaskId = process.argv[2] ?? "config-api-options-v1"
if (!/^[a-z0-9][a-z0-9._-]*$/.test(requestedTaskId)) {
  throw new Error(`invalid task id "${requestedTaskId}"`)
}
const taskPath =
  requestedTaskId === "config-api-options-v1"
    ? join(benchmarkDirectory, "task.json")
    : join(benchmarkDirectory, "tasks", `${requestedTaskId}.json`)
const task = JSON.parse(
  await readFile(taskPath, "utf8"),
)
if (task.id !== requestedTaskId) {
  throw new Error(`task id "${task.id}" does not match "${requestedTaskId}"`)
}
const runsRoot = join(workspaceRoot, "work", "opencode-safechange-benchmark")
const runDirectory = join(runsRoot, task.id)

if (!runDirectory.startsWith(`${runsRoot}\\`) && !runDirectory.startsWith(`${runsRoot}/`)) {
  throw new Error("refusing to prepare a run outside the benchmark work root")
}

await rm(runDirectory, { recursive: true, force: true })
await mkdir(runDirectory, { recursive: true })

await cp(join(benchmarkDirectory, task.fixture), runDirectory, {
  recursive: true,
})
const openCodeDirectory = join(runDirectory, ".opencode")
await mkdir(openCodeDirectory, { recursive: true })
await cp(
  join(repositoryRoot, ".opencode", "agents"),
  join(openCodeDirectory, "agents"),
  { recursive: true },
)
await cp(
  join(repositoryRoot, ".opencode", "tools"),
  join(openCodeDirectory, "tools"),
  { recursive: true },
)
await cp(
  join(repositoryRoot, ".opencode", "package.json"),
  join(openCodeDirectory, "package.json"),
)
await cp(
  join(repositoryRoot, "opencode.json"),
  join(runDirectory, "opencode.json"),
)

const predictionContract = {
  taskId: task.id,
  findings: [
    {
      file: "repository-relative POSIX path",
      classification: "direct | indirect | validation",
      evidence: "specific code or documentation evidence",
    },
  ],
}

const benchmarkTool = `import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tool } from "@opencode-ai/plugin"

const finding = tool.schema.object({
  file: tool.schema.string(),
  classification: tool.schema.enum(["direct", "indirect", "validation"]),
  evidence: tool.schema.string(),
})

export default tool({
  description: "Submit the final machine-readable prediction for an isolated SafeChange benchmark run.",
  args: {
    taskId: tool.schema.string(),
    findings: tool.schema.array(finding),
  },
  async execute(args, context) {
    const outputDirectory = join(context.worktree, ".safechange")
    const outputPath = join(outputDirectory, "prediction.json")
    await mkdir(outputDirectory, { recursive: true })
    await writeFile(outputPath, \`\${JSON.stringify(args, null, 2)}\\n\`, "utf8")
    return \`Benchmark prediction written to \${outputPath}\`
  },
})
`
await writeFile(
  join(openCodeDirectory, "tools", "benchmark-prediction.ts"),
  benchmarkTool,
  "utf8",
)

const prompt = `${task.prompt}

This is a benchmark run. Remain in analysis-only mode and do not edit files.
Before your final response, you must call the benchmark-prediction tool exactly
once with an object following this shape:

${JSON.stringify(predictionContract, null, 2)}

Include only files you believe must be considered in this migration. Use paths
relative to the current worktree with forward slashes. The benchmark is not
complete until the tool confirms that prediction.json was written.`

await writeFile(join(runDirectory, "PROMPT.txt"), `${prompt}\n`, "utf8")
await writeFile(
  join(runDirectory, "RUN-METADATA.json"),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      taskId: task.id,
      preparedAt: new Date().toISOString(),
      answerKeyIncluded: false,
      sourceRepositoryIncluded: false,
      isolatedFromParentGitWorktree: true,
    },
    null,
    2,
  )}\n`,
  "utf8",
)

console.log(runDirectory)
