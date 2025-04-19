#!/usr/bin/env node
import path from 'node:path';
import { rm, mkdir, readdir, rename } from 'node:fs/promises';
import { discoverPlugins } from './discoverPlugins.js';
import { exec } from './utils.js';

/**
 * Discovers all plugins under src/plugins, builds each using the generic buildPluginScripts script,
 * and moves their outputs into dist/[namespace]/[plugin].
 */
const watch = process.argv.includes('--watch');
(async () => {
  const pluginBase = path.join('src', 'plugins');
  const pluginDirs = discoverPlugins(pluginBase);
  if (pluginDirs.length === 0) {
    console.warn(`No plugins found in ${pluginBase}`);
    process.exit(0);
  }
  for (const pluginDir of pluginDirs) {
    const relDir = path.relative(pluginBase, pluginDir);
    const destDir = path.join('dist', relDir);
    if (!watch) {
      await rm(destDir, { recursive: true, force: true });
    }
    await mkdir(destDir, { recursive: true });
    console.log(`Building plugin: ${relDir}`);
    // Invoke the generic build script from within the plugin directory using scripts tsconfig
    // Run the built JavaScript version of the plugin build script
    const scriptsDistDir = path.relative(pluginDir, path.join('dist', 'scripts'));
    const scriptRelJs = path.join(scriptsDistDir, 'buildPluginScripts.js');
    await exec(
      `cd ${pluginDir} && node ${scriptRelJs} ${watch ? '--watch' : ''}`
    );
    if (!watch) {
      // Move built artifacts into dist/[namespace]/[plugin]
      const srcDist = path.join(pluginDir, 'dist');
      try {
        const files = await readdir(srcDist);
        for (const file of files) {
          await rename(path.join(srcDist, file), path.join(destDir, file));
        }
      } catch (err) {
        console.error(`Failed to move built files from ${srcDist} to ${destDir}:`, err);
        process.exit(1);
      }
    }
  }
})();
