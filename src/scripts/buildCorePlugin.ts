#!/usr/bin/env node
import path from 'node:path';
import { rm, mkdir, readdir, rename } from 'node:fs/promises';
import { exists, exec } from './utils.js';

/**
 * Builds the core plugin under src/core using the generic buildPluginScripts script,
 * then moves the output to dist/core and generates an fxmanifest.lua.
 */
const watch = process.argv.includes('--watch');
(async () => {
  const coreDir = path.join('src', 'core');
  if (!(await exists(coreDir))) {
    console.error(`Directory does not exist: ${coreDir}`);
    process.exit(1);
  }
  const destDir = path.join('dist', path.basename(coreDir));
  if (!watch) {
    await rm(destDir, { recursive: true, force: true });
  }
  await mkdir(destDir, { recursive: true });
  console.log('Building core plugin...');
  // Invoke the generic build script from the core directory using scripts tsconfig
  // Run the built JavaScript version of the plugin build script for the core plugin
  const scriptRelJs = path.relative(coreDir, path.join('dist', 'scripts', 'buildPluginScripts.js'));
  await exec(
    `cd ${coreDir} && node ${scriptRelJs} ${watch ? '--watch' : ''}`
  );
  if (!watch) {
    // Move built artifacts into dist/core
    const srcDist = path.join(coreDir, 'dist');
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
})();
