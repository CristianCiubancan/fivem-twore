**Core Plugin**

The core plugin follows the standard plugin layout and provides server-side utilities:

- **plugin.json**: Core plugin manifest.
- **client/**: Client-side scripts.
- **server/**:
  - `index.ts`: Hot-reload HTTP/WebSocket server entrypoint.
  - `manifest.ts`: Plugin manifest loader and validator.
  - `pluginValidator.ts`: Plugin structure validation.
  - `schema/plugin.schema.json`: JSON schema for plugin manifests.
- **html/**: HTML UI files (e.g. NUI Page.tsx).
- **translations/**: Localization resources.
- **types/**: Shared TypeScript type definitions.

Use `startHotReloadServer` from `server/index.ts` to launch the hot-reload server.
