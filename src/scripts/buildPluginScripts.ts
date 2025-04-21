#!/usr/bin/env node
import path from 'node:path';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  writeFileSync,
} from 'node:fs';
import { readJson } from './readJson.js';
import { createFxmanifest } from './fxmanifest.js';
import { createBuilder } from './esbuild.js';
import { StatementResultingChanges } from 'node:sqlite';

const watch = process.argv.includes('--watch');

(async () => {
  const cwd = process.cwd();
  const manifestPath = path.join(cwd, 'plugin.json');
  let pluginManifest;
  try {
    pluginManifest = await readJson(manifestPath);
  } catch (err) {
    console.log(err);
    console.error(`plugin.json not found or invalid at ${manifestPath}`);
    process.exit(1);
  }

  const exportsDef = pluginManifest.exports || {};
  const clientExports = Array.isArray(exportsDef.client)
    ? exportsDef.client
    : [];
  const serverExports = Array.isArray(exportsDef.server)
    ? exportsDef.server
    : [];

  const environments = [];

  // Server bundle: use explicit exports if provided, otherwise fallback to default entry
  const defaultServerEntry = './server/index.ts';
  if (pluginManifest.exports && Array.isArray(pluginManifest.exports.server)) {
    // explicit server exports defined
    if (serverExports.length > 0) {
      const entryPoints = serverExports.map((p: string) => `./${p}`);
      environments.push({ name: 'server', options: { entryPoints } });
    }
  } else if (existsSync(path.join(cwd, 'server', 'index.ts'))) {
    // no explicit exports => build default server entry if it exists
    environments.push({
      name: 'server',
      options: { entryPoints: [defaultServerEntry] },
    });
  }

  // Client bundle: use explicit exports if provided, otherwise fallback to default entry
  const defaultClientEntry = './client/index.ts';
  if (pluginManifest.exports && Array.isArray(pluginManifest.exports.client)) {
    // explicit client exports defined
    if (clientExports.length > 0) {
      const entryPoints = clientExports.map(
        (p: StatementResultingChanges) => `./${p}`
      );
      environments.push({ name: 'client', options: { entryPoints } });
    }
  } else if (existsSync(path.join(cwd, 'client', 'index.ts'))) {
    // no explicit exports => build default client entry if it exists
    environments.push({
      name: 'client',
      options: { entryPoints: [defaultClientEntry] },
    });
  }

  // Ensure dist directory and subdirectories
  const distDir = path.join(cwd, 'dist');
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  // Create client and server directories if they don't exist
  const clientDir = path.join(distDir, 'client');
  const serverDir = path.join(distDir, 'server');
  if (!existsSync(clientDir)) {
    mkdirSync(clientDir, { recursive: true });
  }
  if (!existsSync(serverDir)) {
    mkdirSync(serverDir, { recursive: true });
  }

  // Run build if any environments detected
  if (environments.length > 0) {
    const baseOptions = {
      platform: 'node',
      format: 'cjs',
      sourcemap: watch ? 'inline' : false,
    };
    await createBuilder(watch, baseOptions, environments, async () => {
      // Build complete
    });
  }

  // Copy Lua scripts and JSON files from shared, server, client, and locales folders into dist
  const luaScriptPaths: string[] = [];
  const jsonFilePaths: string[] = [];
  // Directories to search for Lua scripts and JSON files
  const searchDirs = ['shared', 'server', 'client', 'locales'];
  for (const dirName of searchDirs) {
    const srcDir = path.join(cwd, dirName);
    if (!existsSync(srcDir)) continue;
    const collectFiles = (dirPath: string) => {
      for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          collectFiles(fullPath);
        } else if (entry.isFile()) {
          const relPath = path.relative(cwd, fullPath).replace(/\\/g, '/');
          const destPath = path.join(distDir, relPath);
          mkdirSync(path.dirname(destPath), { recursive: true });

          if (entry.name.endsWith('.lua')) {
            luaScriptPaths.push(relPath);
            copyFileSync(fullPath, destPath);
          } else if (entry.name.endsWith('.json')) {
            jsonFilePaths.push(relPath);
            copyFileSync(fullPath, destPath);
          }
        }
      }
    };
    collectFiles(srcDir);
  }

  // Generate fxmanifest.lua in dist
  process.chdir(distDir);

  // Extract shared scripts for reuse
  const sharedScripts = luaScriptPaths.filter((p) => p.startsWith('shared/'));
  const localeScripts = luaScriptPaths.filter((p) => p.startsWith('locales/'));

  // Create shared scripts list: plugin.json overrides if present, else auto-collect
  let shared_scripts: string[];
  if (
    Array.isArray(pluginManifest.shared_scripts) &&
    pluginManifest.shared_scripts.length > 0
  ) {
    shared_scripts = pluginManifest.shared_scripts;
  } else {
    shared_scripts = [
      // auto-collect all shared Lua and locale files
      ...sharedScripts,
      ...localeScripts,
    ];
  }

  // Prepare client scripts - only include client-specific scripts
  const clientScripts = [
    // Include compiled client JS (if any)
    ...(existsSync(path.join(distDir, 'client', 'client.js'))
      ? ['client/client.js']
      : []),
    // Client Lua scripts
    ...luaScriptPaths.filter((p) => p.startsWith('client/')),
  ];

  // Prepare server scripts - only include server-specific scripts
  const serverScripts = [
    // Include any server-specific dependencies
    ...(pluginManifest.server_dependencies || []),
    // Include compiled server JS (if any)
    ...(existsSync(path.join(distDir, 'server', 'server.js'))
      ? ['server/server.js']
      : []),
    // Server Lua scripts
    ...luaScriptPaths.filter((p) => p.startsWith('server/')),
  ];

  // Handle plugin-specific UI pages: generate HTML if a Page.tsx exists under html/
  let ui_page: string | null = null;
  const htmlFiles: string[] = [];
  // Detect if plugin has a UI component source
  const pageTsx = path.join(cwd, 'html', 'Page.tsx');
  if (existsSync(pageTsx)) {
    // Locate the built webview assets directory
    let searchDir = cwd;
    let webviewAssets = '';
    while (true) {
      const candidate = path.join(searchDir, 'dist', 'webview', 'assets');
      if (existsSync(candidate)) {
        webviewAssets = candidate;
        break;
      }
      const parent = path.dirname(searchDir);
      if (parent === searchDir) {
        console.error(
          'Could not locate webview assets directory for UI generation'
        );
        process.exit(1);
      }
      searchDir = parent;
    }
    // Read asset filenames
    const assets = readdirSync(webviewAssets);
    const indexJs = assets.find((f) => /^index-.*\.js$/.test(f));
    const vendorJs = assets.find((f) => /^vendor-.*\.js$/.test(f));
    const indexCss = assets.find((f) => /^index-.*\.css$/.test(f));
    if (!indexJs || !vendorJs || !indexCss) {
      console.error('Missing required webview assets:', assets);
      process.exit(1);
    }
    // Generate the HTML template
    const title = pluginManifest.name || 'UI Resource';
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
      rel="stylesheet"
    />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <script
      type="module"
      crossorigin
      src="https://cfx-nui-webview/assets/${indexJs}"
    ></script>
    <link
      rel="modulepreload"
      crossorigin
      href="https://cfx-nui-webview/assets/${vendorJs}"
    />
    <link
      rel="stylesheet"
      crossorigin
      href="https://cfx-nui-webview/assets/${indexCss}"
    />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
    // Write into plugin dist root
    writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
    ui_page = 'index.html';
    htmlFiles.push('index.html');
  }

  // Combine all files that need to be included (JSON/Lua and generated UI files)
  const files = [...jsonFilePaths, ...htmlFiles];

  const dependencies = Array.isArray(pluginManifest.dependencies)
    ? pluginManifest.dependencies
    : [];

  // Build metadata: plugin.json overrides for fxmanifest keys, then any nested metadata
  const metadata = {
    // Nested metadata has lowest precedence among overrides
    ...(pluginManifest.metadata || {}),
    // fxmanifest version and game overrides
    fx_version: pluginManifest.fx_version || 'cerulean',
    game: pluginManifest.game || 'gta5',
    // lua54 setting (default yes)
    lua54: pluginManifest.lua54 || 'yes',
    // Name, author, version, description overrides from plugin.json
    name: pluginManifest.name,
    author: pluginManifest.author,
    version: pluginManifest.version,
    description: pluginManifest.description,
  };

  // Create the manifest file
  await createFxmanifest({
    client_scripts: clientScripts,
    server_scripts: serverScripts,
    shared_scripts,
    files,
    dependencies,
    metadata,
    ui_page,
  });

  if (!watch) {
    process.exit(0);
  }
})();
