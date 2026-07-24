const { fetchRelease } = require("./github-client")

async function syncRelease(config) {
  const release = await fetchRelease(config.owner, config.repository, config.tag)
  return {
    version: release.tag_name,
    publishedAt: release.published_at,
  }
}

module.exports = { syncRelease }
