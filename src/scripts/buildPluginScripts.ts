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

  const environments: { name: string; options: Record<string, unknown> }[] = [];

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
      const entryPoints = clientExports.map((p: string) => `./${p}`);
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

  // Copy Lua scripts from server and client folders into dist
  const luaScriptPaths: string[] = [];
  const luaDirs = ['server', 'client'];
  for (const dirName of luaDirs) {
    const srcDir = path.join(cwd, dirName);
    if (!existsSync(srcDir)) continue;
    const collectLua = (dirPath: string) => {
      for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          collectLua(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.lua')) {
          const relPath = path.relative(cwd, fullPath).replace(/\\/g, '/');
          luaScriptPaths.push(relPath);
          const destPath = path.join(distDir, relPath);
          mkdirSync(path.dirname(destPath), { recursive: true });
          copyFileSync(fullPath, destPath);
        }
      }
    };
    collectLua(srcDir);
  }

  // Generate fxmanifest.lua in dist
  process.chdir(distDir);
  const clientScripts = [
    ...(existsSync(path.join(distDir, 'client.js')) ? ['client.js'] : []),
    ...luaScriptPaths.filter((p) => p.startsWith('client/')),
  ];
  const serverScripts = [
    ...(existsSync(path.join(distDir, 'server.js')) ? ['server.js'] : []),
    ...luaScriptPaths.filter((p) => p.startsWith('server/')),
  ];
  const files: string[] = [];
  const dependencies: string[] = Array.isArray(pluginManifest.dependencies)
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
