import fs from 'node:fs';
import path from 'node:path';
import { loadManifest } from './manifest.ts';

/**
 * Recursively find all plugin root directories under the given plugins base path.
 * Expected structure: <base>/<namespace>/<pluginName>
 */
export function getPluginDirs(basePath: string): string[] {
  if (!fs.existsSync(basePath)) return [];
  const namespaces = fs.readdirSync(basePath).filter((d) =>
    fs.statSync(path.join(basePath, d)).isDirectory(),
  );
  const pluginDirs: string[] = [];
  for (const ns of namespaces) {
    const nsPath = path.join(basePath, ns);
    const plugins = fs.readdirSync(nsPath).filter((d) =>
      fs.statSync(path.join(nsPath, d)).isDirectory(),
    );
    for (const pluginName of plugins) {
      pluginDirs.push(path.join(nsPath, pluginName));
    }
  }
  return pluginDirs;
}

/**
 * Validate that the plugin directory has the required structure and a valid manifest.
 * Returns a list of errors; an empty list means the plugin is valid.
 */
export function validatePluginStructure(pluginDir: string): string[] {
  const errors: string[] = [];
  const manifestPath = path.join(pluginDir, 'plugin.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push('Missing plugin.json manifest');
  } else {
    try {
      loadManifest(manifestPath);
    } catch (err) {
      errors.push(`Invalid manifest: ${(err as Error).message}`);
    }
  }
  const requiredDirs = ['client', 'server', 'translations', 'html', 'types'];
  for (const dir of requiredDirs) {
    const fullPath = path.join(pluginDir, dir);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
      errors.push(`Missing directory: ${dir}`);
    }
  }
  return errors;
}

/**
 * Validate all plugins under the given base path. Throws an Error if any plugin is invalid.
 */
export function validateAllPlugins(basePath: string): void {
  const pluginDirs = getPluginDirs(basePath);
  const allErrors: Record<string, string[]> = {};
  for (const dir of pluginDirs) {
    const rel = path.relative(basePath, dir);
    const errors = validatePluginStructure(dir);
    if (errors.length > 0) {
      allErrors[rel] = errors;
    }
  }
  if (Object.keys(allErrors).length > 0) {
    let msg = 'Plugin validation failed:\n';
    for (const [plugin, errs] of Object.entries(allErrors)) {
      msg += `- ${plugin}:\n`;
      for (const e of errs) {
        msg += `  - ${e}\n`;
      }
    }
    throw new Error(msg);
  }
}