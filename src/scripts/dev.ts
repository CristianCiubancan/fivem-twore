#!/usr/bin/env node
import path from 'node:path';
import { rm, mkdir, readdir, rename } from 'node:fs/promises';
import chokidar from 'chokidar';
import { discoverPlugins } from './discoverPlugins.js';
import { exec } from './utils.js';

// Paths to built script routines
const scriptsDist = path.resolve(process.cwd(), 'dist', 'scripts');
const buildPluginScripts = path.join(scriptsDist, 'buildPluginScripts.js');
const buildPluginsWebview = path.join(scriptsDist, 'buildPluginsWebview.js');
const buildCorePlugin = path.join(scriptsDist, 'buildCorePlugin.js');
const moveBuiltResources = path.join(scriptsDist, 'moveBuiltResources.js');

// Base directories
const pluginBase = path.join('src', 'plugins');
const coreSrc = path.join('src', 'core');

// Output directories to avoid watching
const distDir = path.resolve(process.cwd(), 'dist');
const outputPaths = [
  distDir,
  '**/dist/**',
  '**/node_modules/**',
  '**/[GENERATED]/**',
];

// Discover plugin directories once at start
const pluginDirs = discoverPlugins(pluginBase).map((d) => path.resolve(d));

// Debounce helpers
const timers = new Map<string, NodeJS.Timeout>();
function debounce(key: string, fn: () => Promise<void>, delay = 100) {
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  const t = setTimeout(async () => {
    timers.delete(key);
    try {
      await fn();
    } catch (err) {
      console.error(`[dev] error in task '${key}':`, err);
    }
  }, delay);
  timers.set(key, t);
}

// Rebuild a single plugin and move its outputs
async function rebuildPlugin(pluginDir: string) {
  const rel = path.relative(pluginBase, pluginDir);
  const dest = path.resolve('dist', rel);
  console.log(`[dev] rebuilding plugin: ${rel}`);
  // clean destination
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  // invoke generic plugin build
  await exec(`cd "${pluginDir}" && node "${buildPluginScripts}"`);
  // move built files
  const srcDist = path.join(pluginDir, 'dist');
    try {
      const files = await readdir(srcDist);
      for (const file of files) {
        await rename(path.join(srcDist, file), path.join(dest, file));
      }
      console.log(`[dev] plugin rebuilt: ${rel}`);
      // Move updated resources to server
      try {
        await rebuildResources();
      } catch (err) {
        console.error('[dev] failed moving built resources after plugin rebuild:', err);
      }
    } catch (err) {
      console.error(`[dev] failed moving build for plugin ${rel}:`, err);
    }
}

// Rebuild the core plugin
async function rebuildCore() {
  console.log('[dev] rebuilding core plugin');
  await exec(`node "${buildCorePlugin}"`);
  console.log('[dev] core plugin rebuilt');
  // Move updated resources to server
  try {
    await rebuildResources();
  } catch (err) {
    console.error('[dev] failed moving built resources after core rebuild:', err);
  }
}

// Rebuild the webview UI resource
async function rebuildWebview() {
  console.log('[dev] rebuilding webview resource');
  await exec(`node "${buildPluginsWebview}"`);
  console.log('[dev] webview resource rebuilt');
  // Move updated resources to server
  try {
    await rebuildResources();
  } catch (err) {
    console.error('[dev] failed moving built resources after webview rebuild:', err);
  }
}

// Flag to prevent rebuilds triggered by our own build process
let isBuilding = false;

// Move built resources (all folders under dist except scripts) into the server resources folder
async function rebuildResources() {
  console.log('[dev] moving built resources');
  await exec(`node "${moveBuiltResources}"`);
  console.log('[dev] resources moved');
}

// Perform an initial build of core, all plugins, webview, and move resources
(async () => {
  isBuilding = true;
  console.log('[dev] performing initial build');
  try {
    // Core plugin
    await rebuildCore();
    // All plugins
    for (const pluginDir of pluginDirs) {
      await rebuildPlugin(pluginDir);
    }
    // Webview UI
    await rebuildWebview();
    // Move generated resources
    await rebuildResources();
  } catch (err) {
    console.error('[dev] initial build error:', err);
  } finally {
    isBuilding = false;
  }
})();

// Watch plugin scripts (TS/JSON) for rebuild
chokidar
  .watch([`${pluginBase}/**/*.{ts,json}`], {
    ignoreInitial: true,
    ignored: outputPaths,
  })
  .on('all', (event, file) => {
    if (isBuilding) return;

    const abs = path.resolve(file);
    const pluginDir = pluginDirs.find((d) => abs.startsWith(d + path.sep));
    if (pluginDir) {
      debounce(pluginDir, async () => {
        isBuilding = true;
        try {
          await rebuildPlugin(pluginDir);
        } finally {
          isBuilding = false;
        }
      });
    }
  });

// Watch core plugin source for rebuild
chokidar
  .watch([`${coreSrc}/**/*.{ts,json}`], {
    ignoreInitial: true,
    ignored: outputPaths,
  })
  .on('all', () => {
    if (isBuilding) return;

    debounce('core', async () => {
      isBuilding = true;
      try {
        await rebuildCore();
      } finally {
        isBuilding = false;
      }
    });
  });

// Watch webview sources and plugin HTML pages for UI rebuild
chokidar
  .watch([`${pluginBase}/**/html/**/*`, `src/webview/**/*`], {
    ignoreInitial: true,
    ignored: outputPaths,
  })
  .on('all', (event, filePath) => {
    if (isBuilding) return;

    // If the file is in a dist directory, ignore it (additional safeguard)
    if (filePath.includes('/dist/') || filePath.includes('\\dist\\')) {
      return;
    }

    debounce('webview', async () => {
      isBuilding = true;
      try {
        await rebuildWebview();
      } finally {
        isBuilding = false;
      }
    });
  });

console.log(
  '[dev] watcher started: watching plugins, core, and webview for changes'
);
