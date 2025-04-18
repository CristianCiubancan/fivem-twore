import { loadManifest, validateManifest, PluginManifest } from './manifest.ts';

/**
 * Core resource entry point for the hot-reload server.
 */
import http from 'node:http';
import path from 'node:path';
import chokidar from 'chokidar';
import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'node:child_process';

/**
 * Starts a hot-reload HTTP/WebSocket server.
 * Watches file changes under src directory, broadcasts 'reload' messages,
 * and can optionally run a command (e.g. to restart a resource).
 * @param options.rootDir The root directory containing the src folder to watch (defaults to current working directory).
 * @param options.port TCP port for WebSocket server (defaults to 3414).
 * @param options.restartCommand Optional shell command args to run on change (e.g. ['fivem-cli','restart','resource']).
 */
export function startHotReloadServer(
  options: { rootDir?: string; port?: number; restartCommand?: string[] } = {}
): void {
  const root = options.rootDir ?? process.cwd();
  const srcDir = path.resolve(root, 'src');

  const port = options.port ?? 3414;
  const server = http.createServer();
  const wss = new WebSocketServer({ server });

  server.listen(port, () =>
    console.log(`Hot-reload server listening on ws://localhost:${port}`)
  );

  wss.on('connection', (_socket: WebSocket) => {
    console.log('Client connected for hot-reload');
  });

  // Set up watcher to only watch changes under the src directory
  const watcher = chokidar.watch(srcDir, {
    ignoreInitial: true,
    persistent: true,
  });

  watcher.on('all', (event: string, changedPath: string) => {
    console.log(`File changed: ${changedPath} (${event}); broadcasting reload`);

    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    }

    // Optionally run a restart command (e.g. restart FiveM resource)
    if (options.restartCommand) {
      const [cmd, ...args] = options.restartCommand;
      const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
      proc.on('exit', (code: number) =>
        console.log(`Restart command exited with code ${code}`)
      );
    }
  });
}

export { loadManifest, validateManifest };
export type { PluginManifest };
export {
  getPluginDirs,
  validatePluginStructure,
  validateAllPlugins,
} from './pluginValidator.ts';
