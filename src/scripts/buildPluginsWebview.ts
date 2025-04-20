#!/usr/bin/env node
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { discoverPlugins } from './discoverPlugins.js';
import { exists, exec } from './utils.js';
import { createFxmanifest } from './fxmanifest.js';

/**
 * Discovers plugins with an html/Page.tsx component, generates src/webview/App.tsx,
 * runs Vite to build the webview, and creates an fxmanifest under dist/webview.
 */
const watch = process.argv.includes('--watch');
(async () => {
  const pluginBase = path.join('src', 'plugins');
  const pluginDirs = discoverPlugins(pluginBase);
  const pages: { importName: string; importPath: string; key: string }[] = [];
  for (const pluginDir of pluginDirs) {
    const pageFile = path.join(pluginDir, 'html', 'Page.tsx');
    if (await exists(pageFile)) {
      // Compute import path relative to src/webview
      const importPath = path
        .relative(path.join('src', 'webview'), pageFile)
        .replace(/\\/g, '/');
      const relPlugin = path
        .relative(pluginBase, pluginDir)
        .replace(/\\/g, '/');
      const [namespace, pluginName] = relPlugin.split('/');
      const nsClean = namespace.replace(/^\[|\]$/g, '');
      const importName = `Page_${nsClean}_${pluginName}`;
      const key = `${nsClean}/${pluginName}`;
      pages.push({ importName, importPath, key });
    }
  }
  // Generate App.tsx
  let content = `// Auto-generated by cli: webview:build\n`;
  for (const page of pages) {
    content += `import ${page.importName} from '${page.importPath}';\n`;
  }
  content += `\nconst App = () => {\n  return (\n    <div className="h-dvh">\n`;
  for (const page of pages) {
    content += `<${page.importName} />\n`;
  }
  content += `    </div>\n  );\n};\n\nexport default App;\n`;
  const appFile = path.join('src', 'webview', 'App.tsx');
  await writeFile(appFile, content, 'utf8');

  console.log('Building webview UI...');
  // Run Vite build from project root
  try {
    if (watch) {
      await exec('npx vite build --watch');
    } else {
      await exec('npx vite build');
    }
  } catch (err) {
    console.warn(
      'Warning: Vite build failed, proceeding to generate fxmanifest:',
      err
    );
  }

  // Generate fxmanifest for the webview resource
  const webviewDist = path.join('dist', 'webview');
  if (!(await exists(webviewDist))) {
    console.error(`Webview dist directory not found: ${webviewDist}`);
    process.exit(1);
  }
  process.chdir(webviewDist);
  // Collect webview resource files: index.html and all assets without duplicates or './' prefixes
  const resourceName = path.basename(webviewDist);
  await createFxmanifest({
    client_scripts: [],
    server_scripts: [],
    files: ['index.html', 'assets/**/*'],
    dependencies: [],
    metadata: { name: resourceName },
    shared_scripts: [],
    ui_page: 'index.html',
  });
})();
