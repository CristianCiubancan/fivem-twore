import { loadManifest, validateManifest, PluginManifest } from './manifest.ts';

/**
 * Core resource entry point for the hot-reload server.
 * (To be implemented in Phase 3.)
 */
import http from 'node:http';
import path from 'node:path';
import chokidar from 'chokidar';
import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'node:child_process';

/**
 * Starts a hot-reload HTTP/WebSocket server.
 * Watches file changes under configured paths and broadcasts 'reload' messages to clients.
 * @param options.watchPaths Array of file globs or paths to watch (defaults to 'dist/resources').
 * @param options.port TCP port for WebSocket server (defaults to 3414).
 */
/**
 * Starts a hot-reload HTTP/WebSocket server.
 * Watches file changes under configured paths, broadcasts 'reload' messages,
 * and can optionally run a command (e.g. to restart a resource).
 * @param options.watchPaths Array of file globs or paths to watch (defaults to 'dist/resources').
 * @param options.port TCP port for WebSocket server (defaults to 3414).
 * @param options.restartCommand Optional shell command args to run on change (e.g. ['fivem-cli','restart','resource']).
 */
export function startHotReloadServer(
  options: { watchPaths?: string[]; port?: number; restartCommand?: string[] } = {}
): void {
  const root = process.cwd();
  const watchPaths = options.watchPaths ?? [path.resolve(root, 'dist', 'resources')];
  const port = options.port ?? 3414;
  const server = http.createServer();
  const wss = new WebSocketServer({ server });
  server.listen(port, () => console.log(`Hot-reload server listening on ws://localhost:${port}`));
  wss.on('connection', (_socket: WebSocket) => {
    console.log('Client connected for hot-reload');
  });
  const watcher = chokidar.watch(watchPaths, { ignoreInitial: true });
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
export { getPluginDirs, validatePluginStructure, validateAllPlugins } from './pluginValidator.ts';