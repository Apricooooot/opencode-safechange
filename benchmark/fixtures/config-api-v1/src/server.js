import { loadCached } from "./cache.js"
import { parseConfig } from "./config.js"

export function loadServerConfig(options) {
  return loadCached(options.configPath, parseConfig)
}

