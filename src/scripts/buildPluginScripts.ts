#!/usr/bin/env node
import path from 'node:path';
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { readJson } from './readJson.js';
import { createFxmanifest } from './fxmanifest.js';
import { createBuilder } from './esbuild.js';

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
      const entryPoints = serverExports.map((p: unknown) => `./${p}`);
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
      const entryPoints = clientExports.map((p: unknown) => `./${p}`);
      environments.push({ name: 'client', options: { entryPoints } });
    }
  } else if (existsSync(path.join(cwd, 'client', 'index.ts'))) {
    // no explicit exports => build default client entry if it exists
    environments.push({
      name: 'client',
      options: { entryPoints: [defaultClientEntry] },
    });
  }

  // Ensure dist directory
  const distDir = path.join(cwd, 'dist');
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
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
  // Prepare script entries for fxmanifest.lua, ensuring shared and locale files load before code
  const clientScripts = [
    // Shared config (available to client)
    ...luaScriptPaths.filter((p: string) => p.startsWith('shared/')),
    // Locale files (initialize Lang)
    ...luaScriptPaths.filter((p: string) => p.startsWith('locales/')),
    // Compiled client JS (if any)
    ...(existsSync(path.join(distDir, 'client.js')) ? ['client.js'] : []),
    // Client Lua scripts
    ...luaScriptPaths.filter((p: string) => p.startsWith('client/')),
  ];
  const serverScripts = [
    // Shared config
    ...luaScriptPaths.filter((p: string) => p.startsWith('shared/')),
    // Locale files (initialize Lang)
    ...luaScriptPaths.filter((p: string) => p.startsWith('locales/')),
    // Compiled server JS (if any)
    ...(existsSync(path.join(distDir, 'server.js')) ? ['server.js'] : []),
    // Server Lua scripts
    ...luaScriptPaths.filter((p: string) => p.startsWith('server/')),
  ];

  // Include JSON files in the 'files' array for fxmanifest.lua
  const files = jsonFilePaths;

  const dependencies = Array.isArray(pluginManifest.dependencies)
    ? pluginManifest.dependencies
    : [];
  const metadata = {
    name: pluginManifest.name,
    author: pluginManifest.author,
    version: pluginManifest.version,
    description: pluginManifest.description,
  };

  await createFxmanifest({
    client_scripts: clientScripts,
    server_scripts: serverScripts,
    files,
    dependencies,
    metadata,
  });

  if (!watch) {
    process.exit(0);
  }
})();
