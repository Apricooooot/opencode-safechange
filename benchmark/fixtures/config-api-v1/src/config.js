import { readFile } from "node:fs/promises"

export async function parseConfig(path) {
  const source = await readFile(path, "utf8")
  return JSON.parse(source)
}

