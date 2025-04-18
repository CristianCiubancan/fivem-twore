This directory contains the TypeScript-based CLI for managing and building our FiveM resources.

## Getting Started

Ensure you have installed dependencies:
  npm install

### Running the CLI

Commands are available via the `_cli` script. Example:
  npm run _cli -- <command> [options]

For convenience, direct npm scripts are also provided:
- `npm run plugin:create -- <namespace> <name>`: Scaffold a new plugin
- `npm run webview:build`: Build combined webview NUI resource
- `npm run script:build`: Build client/server scripts for all plugins
- `npm run dev:full`: Start development environment (hot-reload + webview)
- `npm run build:full`: Build all resources (plugin scripts, core, and webview)

See `src/scripts/cli.ts` for command implementations and usage details.
