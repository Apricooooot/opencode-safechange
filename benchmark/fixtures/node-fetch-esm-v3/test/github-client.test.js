const test = require("node:test")
const assert = require("node:assert/strict")
const Module = require("node:module")

test("reports unsuccessful GitHub responses", async () => {
  const originalLoad = Module._load
  Module._load = (request, parent, isMain) =>
    request === "node-fetch"
      ? async () => ({ ok: false, status: 404 })
      : originalLoad(request, parent, isMain)

  delete require.cache[require.resolve("../src/github-client")]
  const { fetchRelease } = require("../src/github-client")
  await assert.rejects(
    fetchRelease("acme", "service", "v1"),
    /GitHub request failed: 404/,
  )
  Module._load = originalLoad
})
