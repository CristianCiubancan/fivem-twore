#!/usr/bin/env node
import path from 'node:path';
import { rm, mkdir, readdir, rename, writeFile, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { discoverPlugins } from './discoverPlugins.js';
import { exec, exists } from './utils.js';
import { spawn } from 'child_process';
import { createFxmanifest } from './fxmanifest.js';

/**
 * Builds a webview for a single plugin
 * @param pluginDir Path to the plugin directory
 * @param destDir Path to the destination directory
 * @param watch Whether to watch for changes
 */
async function buildPluginWebview(
  pluginDir: string,
  destDir: string,
  watch: boolean
) {
  const pageFile = path.join(pluginDir, 'html', 'Page.tsx');
  if (!(await exists(pageFile))) {
    return false;
  }

  console.log(`Building webview for plugin: ${path.basename(pluginDir)}`);

  // Create a temporary App.tsx that imports only this plugin's Page
  const relPlugin = path
    .relative(path.join('src', 'plugins'), pluginDir)
    .replace(/\\/g, '/');
  const parts = relPlugin.split('/');
  let namespace = '';
  let pluginName = '';
  if (parts.length === 1) {
    pluginName = parts[0];
  } else {
    namespace = parts[0];
    pluginName = parts.slice(1).join('_');
  }

  // Create a unique output directory for this plugin's webview
  const webviewOutputDir = path.join(pluginDir, 'dist', 'ui');
  await mkdir(webviewOutputDir, { recursive: true });

  // Create a temporary directory for webview build
  const tempDir = path.join('temp', 'webview', relPlugin);
  await mkdir(tempDir, { recursive: true });

  // Create a temporary App.tsx for this plugin
  const importPath = path.relative(tempDir, pageFile).replace(/\\/g, '/');

  let content = `// Auto-generated for plugin webview build\n`;
  content += `import React from 'react';\n`;
  content += `import Page from '${importPath}';\n`;
  content += `\nconst App = () => {\n  return (\n    <div className="h-dvh">\n`;
  content += `      <Page />\n`;
  content += `    </div>\n  );\n};\n\nexport default App;\n`;

  const appFile = path.join(tempDir, 'App.tsx');
  await writeFile(appFile, content, 'utf8');

  // Create a temporary main.tsx to bootstrap this plugin's App
  const mainContent = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
`;
  await writeFile(path.join(tempDir, 'main.tsx'), mainContent, 'utf8');

  // Create an index.html that loads main.tsx
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pluginName} UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
`;
  await writeFile(path.join(tempDir, 'index.html'), htmlContent, 'utf8');

  // Create a custom vite config that outputs to this plugin's dist/ui
  const viteConfigContent = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Run from project root of tempDir
  root: '.',
  base: './',
  plugins: [react()],
  build: {
    outDir: '${path.relative(tempDir, webviewOutputDir).replace(/\\/g, '/')}',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
  resolve: {
    alias: {
      // Map '@' to project src directory
      '@': path.resolve(__dirname, '../../../src'),
    },
  },
});
`;
  await writeFile(
    path.join(tempDir, 'vite.config.ts'),
    viteConfigContent,
    'utf8'
  );

  // Run Vite build for this plugin's webview
  try {
    if (watch) {
      await exec(`cd ${tempDir} && npx vite build --watch`);
    } else {
      await exec(`cd ${tempDir} && npx vite build`);
    }
  } catch (err) {
    console.warn(
      `Warning: Vite build failed for plugin ${pluginName} webview:`,
      err
    );
    return false;
  }

  // Copy webview files to the final destination
  const webviewDest = path.join(destDir, 'ui');
  if (!watch) {
    // In watch mode, vite writes directly to the destination
    try {
      await mkdir(webviewDest, { recursive: true });
      // Copy all built files from webviewOutputDir to webviewDest
      const files = await readdir(webviewOutputDir);
      for (const file of files) {
        await cp(
          path.join(webviewOutputDir, file),
          path.join(webviewDest, file),
          { recursive: true }
        );
      }
    } catch (err) {
      console.error(
        `Failed to copy webview files from ${webviewOutputDir} to ${webviewDest}:`,
        err
      );
      return false;
    }
  }

  return true;
}

/**
 * Discovers all plugins under src/plugins, builds each using the generic buildPluginScripts script,
 * and moves their outputs into dist/[namespace]/[plugin]. Also builds individual webviews for
 * plugins that have html/Page.tsx components.
 */
const watch = process.argv.includes('--watch');
// Capture the original working directory to restore later when changing cwd
const originalCwd = process.cwd();
(async () => {
  const pluginBase = path.join('src', 'plugins');
  const pluginDirs = discoverPlugins(pluginBase);
  if (pluginDirs.length === 0) {
    console.warn(`No plugins found in ${pluginBase}`);
    process.exit(0);
  }
  for (const pluginDir of pluginDirs) {
    // Ensure cwd is reset to project root before processing each plugin
    process.chdir(originalCwd);
    // Determine plugin relative path and clean namespace brackets for output
    const relDirRaw = path.relative(pluginBase, pluginDir);
    const destDir = path.join('dist', relDirRaw);
    if (!watch) {
      await rm(destDir, { recursive: true, force: true });
    }
    await mkdir(destDir, { recursive: true });
    console.log(`Building plugin: ${relDirRaw}`);

    // Invoke the generic build script from within the plugin directory using scripts tsconfig
    // Locate the built script entry for plugin scripts
    const scriptsDistDir = path.relative(
      pluginDir,
      path.join('dist', 'scripts')
    );
    const scriptRelJs = path.join(scriptsDistDir, 'buildPluginScripts.js');
    // Resolve to absolute path to ensure cross-platform correctness
    const scriptPath = path.resolve(pluginDir, scriptRelJs);
    // Spawn the generic buildPluginScripts.js via cwd to avoid quoting issues
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [scriptPath, ...(watch ? ['--watch'] : [])],
        { cwd: pluginDir, stdio: 'inherit' }
      );
      child.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(
            `buildPluginScripts.js in ${pluginDir} exited with code ${code} and signal ${signal}`
          ));
        }
      });
    });

    // Check if this plugin has an html/Page.tsx component
    const hasWebview = await exists(path.join(pluginDir, 'html', 'Page.tsx'));
    let webviewBuilt = false;

    if (hasWebview) {
      // Build webview for this plugin
      webviewBuilt = await buildPluginWebview(pluginDir, destDir, watch);
    }

    if (!watch) {
      // Move built artifacts into dist/[namespace]/[plugin]
      const srcDist = path.join(pluginDir, 'dist');
      try {
        const files = await readdir(srcDist);
        for (const file of files) {
          // Skip ui folder if webview was already built/copied
          if (webviewBuilt && file === 'ui') continue;
          await rename(
            path.join(srcDist, file),
            path.join(destDir, file)
          );
        }
      } catch (err) {
        console.error(
          `Failed to move built files from ${srcDist} to ${destDir}:`,
          err
        );
        process.exit(1);
      }

      // If webview was built, update the fxmanifest to include the UI
      if (webviewBuilt) {
        const fxmanifestPath = path.join(destDir, 'fxmanifest.lua');
        if (existsSync(fxmanifestPath)) {
          // Generate updated fxmanifest in destDir
          let uiFiles: string[] = [];
          try {
            // Change cwd to destDir to write fxmanifest
            process.chdir(destDir);
            // Collect all UI files under ui/
            const collectUiFiles = async (dir: string, prefix = '') => {
              const entries = await readdir(dir, { withFileTypes: true });
              for (const entry of entries) {
                const filePath = path.join(dir, entry.name);
                const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
                if (entry.isDirectory()) {
                  await collectUiFiles(filePath, rel);
                } else {
                  uiFiles.push(rel);
                }
              }
            };
            const uiDir = path.join(destDir, 'ui');
            if (existsSync(uiDir)) {
              await collectUiFiles(uiDir, 'ui');
            }
            // Create new fxmanifest with ui_page
            await createFxmanifest({
              client_scripts: [],
              server_scripts: [],
              shared_scripts: [],
              files: uiFiles,
              dependencies: [],
              metadata: {},
              ui_page: 'ui/index.html',
            });
          } catch (err) {
            console.error(`Failed to update fxmanifest in ${destDir}:`, err);
          } finally {
            // Restore original working directory
            process.chdir(originalCwd);
          }
        }
      }
    }
  }
})();
