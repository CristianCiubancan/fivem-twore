import { readJson } from './readJson.js';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'node:path';

/**
 * Formats an array into a block-style string with each item on a new line.
 * @param name - The name of the section.
 * @param files - The array of file names.
 * @returns The formatted string or an empty string if the array is empty.
 */
function formatArrayBlock(name, files) {
  if (!files?.length) return '';

  const indentedItems = files
    .map((value) => (value ? `    '${value}'` : ''))
    .join(',\n');
  return `${name} {\n${indentedItems}\n}\n`;
}

/**
 * Formats key-value pairs into a string with each pair on a new line.
 * @param object - The object containing key-value pairs.
 * @returns The formatted string.
 */
function formatKeyValuePairs(object) {
  return (
    Object.entries(object)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key} '${value}'`)
      .join('\n') + '\n'
  );
}

/**
 * Creates the `fxmanifest.lua` file based on the resource manifest.
 * @param resourceManifest - The resource manifest containing script and file information.
 * @returns The generated `fxmanifest.lua` content as a string.
 */
export async function createFxmanifest({
  client_scripts,
  server_scripts,
  shared_scripts,
  files,
  dependencies,
  metadata,
  ui_page,
}) {
  // Find the nearest package.json by searching upwards from current directory
  let dir = process.cwd();
  let pkgPath;
  while (true) {
    const candidate = path.join(dir, 'package.json');
    if (existsSync(candidate)) {
      pkgPath = candidate;
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      console.error('package.json not found');
      process.exit(1);
    }
    dir = parent;
  }

  const pkg = await readJson(pkgPath);

  // Set default metadata values from package.json
  const fxmanifest = {
    fx_version: 'cerulean',
    game: 'gta5',
    name: pkg.name,
    author: pkg.author,
    version: pkg.version,
    description: pkg.description,
    ...(metadata || {}),
  };

  // Build the output string
  let output = formatKeyValuePairs(fxmanifest);

  // Add shared scripts if provided
  if (shared_scripts?.length) {
    output += formatArrayBlock('shared_scripts', shared_scripts);
  }

  // Add client and server scripts
  if (client_scripts?.length) {
    output += formatArrayBlock('client_scripts', client_scripts);
  }

  if (server_scripts?.length) {
    output += formatArrayBlock('server_scripts', server_scripts);
  }

  // Add UI page if provided
  if (ui_page) {
    output += `ui_page '${ui_page}'\n`;
  }

  // Add files and dependencies
  if (files?.length) {
    output += formatArrayBlock('files', files);
  }

  if (dependencies?.length) {
    output += formatArrayBlock('dependencies', dependencies);
  }

  await writeFile('fxmanifest.lua', output);
  return output;
}
