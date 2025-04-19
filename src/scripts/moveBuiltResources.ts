#!/usr/bin/env node
import path from 'node:path';
import 'dotenv/config';
import {
  readdir,
  rm,
  mkdir,
  rename,
  readFile,
  writeFile,
} from 'node:fs/promises';
import { exists } from './utils.js';

(async () => {
  const serverName = process.env.SERVER_NAME;
  if (!serverName) {
    console.error('Environment variable SERVER_NAME is not defined.');
    process.exit(1);
  }

  const projectDir = process.cwd();
  const serverDir = path.join(projectDir, 'txData', serverName);
  if (!(await exists(serverDir))) {
    console.error(`Server directory does not exist: ${serverDir}`);
    process.exit(1);
  }

  const resourcesDir = path.join(serverDir, 'resources');
  await mkdir(resourcesDir, { recursive: true });

  const distDir = path.join(projectDir, 'dist');
  let distEntries;
  try {
    distEntries = await readdir(distDir, { withFileTypes: true });
  } catch (err) {
    console.error(`Failed to read dist directory: ${distDir}`, err);
    process.exit(1);
  }

  // Move each built resource (excluding scripts) into the server resources folder
  const movedResources = [];
  for (const entry of distEntries) {
    if (!entry.isDirectory() || entry.name === 'scripts') {
      continue;
    }

    const srcPath = path.join(distDir, entry.name);
    const destPath = path.join(resourcesDir, '[GENERATED]', entry.name);
    try {
      await rm(destPath, { recursive: true, force: true });
      await mkdir(path.dirname(destPath), { recursive: true });
      await rename(srcPath, destPath);
      console.log(`Moved resource '${entry.name}' to server resources.`);
      movedResources.push(entry.name);
    } catch (err) {
      console.error(`Failed to move resource '${entry.name}':`, err);
      process.exit(1);
    }
  }

  // Update server.cfg to ensure [GENERATED] resources are loaded and add TCP endpoint
  const cfgPath = path.join(serverDir, 'server.cfg');
  let cfgText;
  try {
    cfgText = await readFile(cfgPath, 'utf8');
  } catch (err) {
    console.error(`Failed to read server.cfg at: ${cfgPath}`, err);
    process.exit(1);
  }

  // Split the config into lines for easier manipulation
  const lines = cfgText.split('\n');

  // Check for existing ensure [GENERATED] line
  const hasGeneratedEnsure = lines.some((line) =>
    line.trim().startsWith('ensure [GENERATED]')
  );

  let configUpdated = false;

  // If we don't have an ensure [GENERATED] line and we have moved resources, add it
  if (!hasGeneratedEnsure && movedResources.length > 0) {
    // Find a good place to add the ensure directive
    // Usually after other ensure directives
    let lastEnsureIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('ensure ')) {
        lastEnsureIndex = i;
      }
    }

    if (lastEnsureIndex >= 0) {
      // Insert after the last ensure directive
      lines.splice(lastEnsureIndex + 1, 0, 'ensure [GENERATED]');
    } else {
      // If no ensure directives found, add at the end
      lines.push('ensure [GENERATED]');
    }

    console.log('Added ensure [GENERATED] to server.cfg');
    configUpdated = true;
  }

  // Only write the file if we actually made changes
  if (configUpdated) {
    const newCfg = lines.join('\n');
    try {
      await writeFile(cfgPath, newCfg, 'utf8');
      console.log('Updated server.cfg.');
    } catch (err) {
      console.error(`Failed to write server.cfg at: ${cfgPath}`, err);
      process.exit(1);
    }
  } else {
    console.log('No changes needed to server.cfg');
  }
})();
