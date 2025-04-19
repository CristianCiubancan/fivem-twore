import fs from 'node:fs';
import path from 'node:path';

/**
 * Recursively searches a directory for folders containing a plugin.json file
 * @param dirPath The directory path to search
 * @returns Array of paths to directories containing plugin.json files
 */
export const discoverPlugins = (dirPath: string): string[] => {
  // Check if the directory exists
  if (!fs.existsSync(dirPath)) {
    console.warn(`Directory does not exist: ${dirPath}`);
    return [];
  }

  let pluginDirs: string[] = [];

  // Check if the current directory contains a plugin.json file
  const manifestPath = path.join(dirPath, 'plugin.json');
  if (fs.existsSync(manifestPath)) {
    pluginDirs.push(dirPath);
  }

  // Recursively search subdirectories
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(dirPath, entry.name);
        // Skip node_modules and dist directories to avoid unnecessary traversal
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          const subDirPlugins = discoverPlugins(fullPath);
          pluginDirs = pluginDirs.concat(subDirPlugins);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return pluginDirs;
};
