#!/usr/bin/env node
import 'dotenv/config';
import path from 'node:path';
import { rm, mkdir, readdir, rename } from 'node:fs/promises';
import chokidar from 'chokidar';
import { discoverPlugins } from './discoverPlugins.js';
import { exec, exists } from './utils.js';
import CoreManager from './coreManagerScript.js';

// Initialize the resource manager
const resourceManager = new CoreManager();

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

// Restart a resource after rebuild
async function restartResource(resourceName: string) {
  try {
    // Check if the resource exists before attempting to restart
    const exists = await resourceManager.resourceExists(resourceName);
    if (!exists) {
      console.log(
        `[dev] resource '${resourceName}' not found, starting resource`
      );
      // Start the resource if it is not already running
      const startResult = await resourceManager.startResource(resourceName);
      if (startResult.success) {
        console.log(
          `[dev] resource '${resourceName}' started successfully`
        );
      } else {
        console.error(
          `[dev] failed to start resource '${resourceName}': ${startResult.message}`
        );
      }
      return;
    }

    console.log(`[dev] restarting resource: ${resourceName}`);
    const result = await resourceManager.restartResource(resourceName);

    if (result.success) {
      console.log(`[dev] resource '${resourceName}' restarted successfully`);
    } else {
      console.error(
        `[dev] failed to restart resource '${resourceName}': ${result.message}`
      );
    }
  } catch (error) {
    console.error(`[dev] error restarting resource '${resourceName}':`, error);
  }
}

// Extract resource name from plugin directory
function getResourceNameFromPluginDir(pluginDir: string): string {
  // Get the plugin name from the directory (last part of the path)
  const pluginName = path.basename(pluginDir);
  // Convert to resource name format (could be customized based on your naming convention)
  return `${pluginName}`;
}

// Rebuild a single plugin and move its outputs
async function rebuildPlugin(pluginDir: string, moveResources = true) {
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
    if (moveResources) {
      try {
        await rebuildResources();
        // Restart the corresponding resource
        const resourceName = getResourceNameFromPluginDir(pluginDir);
        await restartResource(resourceName);
      } catch (err) {
        console.error(
          '[dev] failed moving built resources after plugin rebuild:',
          err
        );
      }
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
    // Restart the core resource
    await restartResource('core');
  } catch (err) {
    console.error(
      '[dev] failed moving built resources after core rebuild:',
      err
    );
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
    // Restart the webview resource
    await restartResource('webview');
  } catch (err) {
    console.error(
      '[dev] failed moving built resources after webview rebuild:',
      err
    );
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

// Get a list of all resources on startup for validation purposes
let availableResources: string[] = [];
async function fetchAvailableResources() {
  try {
    availableResources = await resourceManager.getResources();
    console.log(
      `[dev] discovered ${availableResources.length} resources on the server`
    );
  } catch (error) {
    console.error('[dev] failed to fetch available resources:', error);
  }
}

// Perform an initial build of core, all plugins, webview, and move resources
(async () => {
  isBuilding = true;
  console.log('[dev] performing initial build');

  // First fetch available resources
  await fetchAvailableResources();

  try {
    // Core plugin
    await rebuildCore();
    // Webview UI resource
    await rebuildWebview();
    // All plugins
    for (const pluginDir of pluginDirs) {
      await rebuildPlugin(pluginDir);
    }
    // Move generated resources
    await rebuildResources();
  } catch (err) {
    console.error('[dev] initial build error:', err);
  } finally {
    isBuilding = false;
  }
})();

// Watch plugin scripts (TS, JSON, and Lua) for rebuild
chokidar
  .watch([`${pluginBase}/**/*.{ts,json,lua}`], {
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

// Add a new watcher for specific resources that might be rebuilt outside our normal workflow
// Watch generic resource rebuilds (e.g. fxserver calling refresh)
chokidar
  .watch(['dist/**/*'], {
    ignoreInitial: true,
    ignored: [...outputPaths, 'dist/scripts/**'],
  })
  .on('all', (event, filePath) => {
    if (isBuilding) return;

    // Extract potential resource name from the path
    const relativePath = path.relative(distDir, path.dirname(filePath));
    const potentialResource = relativePath.split(path.sep)[0];

    if (potentialResource && potentialResource !== 'scripts') {
      debounce(`resource-${potentialResource}`, async () => {
        await restartResource(potentialResource);
      });
    }
  });

// Watch moved webview assets in server resources for plugin UI updates
{
  const serverName = process.env.SERVER_NAME;
  if (serverName) {
    const movedWebviewAssets = path.join(
      'txData',
      serverName,
      'resources',
      '[GENERATED]',
      'webview',
      'assets'
    );
    chokidar
      .watch(`${movedWebviewAssets}/**/*`, { ignoreInitial: true })
      .on('all', (event, filePath) => {
        if (isBuilding) return;
        debounce('moved-webview-assets', async () => {
          isBuilding = true;
          try {
            for (const pluginDir of pluginDirs) {
              const pageTsx = path.join(pluginDir, 'html', 'Page.tsx');
              if (await exists(pageTsx)) {
                await rebuildPlugin(pluginDir);
              }
            }
          } catch (err) {
            console.error(
              '[dev] failed rebuilding plugin UIs after webview asset update:',
              err
            );
          } finally {
            isBuilding = false;
          }
        });
      });
  } else {
    console.warn(
      '[dev] SERVER_NAME not defined; skipping moved webview assets watcher'
    );
  }
}

console.log(
  '[dev] watcher started: watching plugins, core, webview sources, and moved webview assets for plugin UI changes'
);
