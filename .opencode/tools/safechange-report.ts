import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tool } from "@opencode-ai/plugin"

const finding = tool.schema.object({
  file: tool.schema.string(),
  impact: tool.schema.string(),
  confidence: tool.schema.enum(["confirmed", "likely", "unknown"]),
})

export default tool({
  description:
    "Write a structured, auditable SafeChange migration report inside the current worktree.",
  args: {
    title: tool.schema.string(),
    status: tool.schema.enum(["planned", "completed", "failed"]),
    summary: tool.schema.string(),
    findings: tool.schema.array(finding),
    commands: tool.schema.array(
      tool.schema.object({
        command: tool.schema.string(),
        outcome: tool.schema.enum(["passed", "failed", "skipped"]),
        detail: tool.schema.string(),
      }),
    ),
    residualRisks: tool.schema.array(tool.schema.string()),
    rollback: tool.schema.array(tool.schema.string()),
  },
  async execute(args, context) {
    const outputDirectory = join(context.worktree, ".safechange")
    const reportPath = join(outputDirectory, "report.json")
    const report = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      sessionID: context.sessionID,
      agent: context.agent,
      ...args,
    }

    await mkdir(outputDirectory, { recursive: true })
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")

    return `SafeChange report written to ${reportPath}`
  },
})

