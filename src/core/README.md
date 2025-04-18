This is going to be the main resource of our server. It provides:

- A (stub) hot-reload HTTP/WebSocket server (`startHotReloadServer` in `index.ts`).
- Utilities to validate plugin manifests and directory layouts:
  - JSON Schema: `schema/plugin.schema.json`
  - Manifest loader/validator: `loadManifest`, `validateManifest`, `PluginManifest`
  - Plugin structure checks: `getPluginDirs`, `validatePluginStructure`, `validateAllPlugins`
