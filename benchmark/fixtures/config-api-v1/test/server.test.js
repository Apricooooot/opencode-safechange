import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { clearCache } from "../src/cache.js"
import { loadServerConfig } from "../src/server.js"

test("loads server configuration", async () => {
  clearCache()
  const directory = await mkdtemp(join(tmpdir(), "safechange-server-"))
  const path = join(directory, "server.json")
  await writeFile(path, '{"host": "127.0.0.1"}')

  assert.equal(
    (await loadServerConfig({ configPath: path })).host,
    "127.0.0.1",
  )
})

