import path from 'node:path';
import { promises as fs } from 'node:fs';
import * as ts from 'typescript';

/**
 * Recursively copy a directory from src to dest.
 * Ignores missing source directories.
 */
export async function copyDir(src: string, dest: string): Promise<void> {
  try {
    const entries = await fs.readdir(src, { withFileTypes: true });
    await fs.mkdir(dest, { recursive: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else if (entry.isFile()) {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch {
    // ignore errors (e.g. missing dirs)
  }
}

/**
 * Recursively collect all file paths under dir, returning
 * their paths relative to base, using forward slashes.
 */
export async function collectFiles(dir: string, base: string): Promise<string[]> {
  const files: string[] = [];
  async function recurse(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await recurse(fullPath);
      } else if (entry.isFile()) {
        const rel = path.relative(base, fullPath).split(path.sep).join('/');
        files.push(rel);
      }
    }
  }
  try {
    await recurse(dir);
  } catch {
    // ignore missing dirs
  }
  return files;
}

/**
 * Recursively transpile all .ts files under dir to .js,
 * targeting ES2020 and ESNext modules. Removes original .ts files.
 */
export async function transpileTsFiles(dir: string): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await transpileTsFiles(fullPath);
      } else if (entry.isFile() && fullPath.endsWith('.ts')) {
        const srcCode = await fs.readFile(fullPath, 'utf8');
        const result = ts.transpileModule(srcCode, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
        });
        const outPath = fullPath.slice(0, -3) + '.js';
        await fs.writeFile(outPath, result.outputText, 'utf8');
        await fs.unlink(fullPath);
      }
    }
  } catch {
    // ignore missing dirs
  }
}