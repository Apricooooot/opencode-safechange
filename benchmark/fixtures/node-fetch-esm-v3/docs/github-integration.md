# GitHub integration

The service runs on Node.js 14 and loads `node-fetch` with CommonJS `require`.
`fetchRelease` rejects with `GitHub request failed: <status>` for non-2xx
responses.
