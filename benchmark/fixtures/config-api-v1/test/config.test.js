import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { parseConfig } from "../src/config.js"

test("parses a JSON configuration path", async () => {
  const directory = await mkdtemp(join(tmpdir(), "safechange-config-"))
  const path = join(directory, "config.json")
  await writeFile(path, '{"port": 3000}')

  assert.deepEqual(await parseConfig(path), { port: 3000 })
})

