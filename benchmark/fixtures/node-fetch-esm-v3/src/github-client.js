const fetch = require("node-fetch")

async function fetchRelease(owner, repository, tag) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repository}/releases/tags/${tag}`,
    { headers: { accept: "application/vnd.github+json" } },
  )
  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status}`)
  }
  return response.json()
}

module.exports = { fetchRelease }
