import fs from 'node:fs';
import path from 'node:path';
import Ajv, { ErrorObject } from 'ajv';
import * as schema from './schema/plugin.schema.json' with {
  type: 'json',
};

// For ES2017 compatibility, use only __dirname or process.cwd()
// This avoids using import.meta which requires newer module settings

// Load and parse the plugin manifest JSON schema

/**
 * Represents the shape of a plugin manifest (plugin.json).
 */
export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  exports?: {
    client?: string[];
    server?: string[];
  };
  permissions?: string[];
}

const ajv = new Ajv({ allErrors: true });
const validateFn = ajv.compile<PluginManifest>(schema);

/**
 * Validate arbitrary data against the plugin manifest schema.
 * @param data The data to validate.
 * @throws Error if validation fails.
 */
export function validateManifest(
  data: unknown
): asserts data is PluginManifest {
  const valid = validateFn(data);
  if (!valid) {
    const errors = validateFn.errors as ErrorObject[];
    const message = ajv.errorsText(errors, { separator: '\n' });
    throw new Error(`Invalid plugin manifest:\n${message}`);
  }
}

/**
 * Load and parse a plugin manifest from disk, validating its contents.
 * @param manifestPath Path to the plugin.json file.
 * @returns The validated PluginManifest object.
 * @throws Error if the file is missing, invalid JSON, or fails schema validation.
 */
export function loadManifest(manifestPath: string): PluginManifest {
  const fullPath = path.resolve(manifestPath);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to parse JSON at ${fullPath}: ${(err as Error).message}`
    );
  }
  validateManifest(data);
  return data;
}
