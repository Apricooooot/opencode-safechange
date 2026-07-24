import { parseConfig } from "./config.js"

const path = process.argv[2]

if (!path) {
  console.error("usage: node src/cli.js <config.json>")
  process.exitCode = 2
} else {
  console.log(await parseConfig(path))
}

