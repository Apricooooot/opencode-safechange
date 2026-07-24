const cache = new Map()

export async function loadCached(path, loader) {
  if (!cache.has(path)) cache.set(path, await loader(path))
  return cache.get(path)
}

export function clearCache() {
  cache.clear()
}

