/// <reference types="@citizenfx/server" />
/**
 * FiveM Resource HTTP Server
 * This resource creates a simple HTTP server that logs all incoming requests
 */

// Wrap everything in a namespace or IIFE to avoid global scope pollution
(function () {
  // Configuration
  const PORT = GetConvar('http_server_port', '50120');
  const HOST = GetConvar('http_server_host', '0.0.0.0');

  // Server instance flag
  let httpServerActive = false;

  // Log with resource name prefix
  function logWithPrefix(message: string): void {
    console.log(`[${GetCurrentResourceName()}] ${message}`);
  }

  // On resource start
  on('onResourceStart', (resourceName: string) => {
    if (GetCurrentResourceName() !== resourceName) return;
    logWithPrefix(`Starting HTTP server on ${HOST}:${PORT}`);
    startHttpServer();
  });

  // On resource stop
  on('onResourceStop', (resourceName: string) => {
    if (GetCurrentResourceName() !== resourceName) return;
    logWithPrefix('Stopping HTTP server');
    stopHttpServer();
  });

  /**
   * Starts the HTTP server
   */
  function startHttpServer(): void {
    try {
      // Set flag to indicate server is running
      httpServerActive = true;

      // Set up the server handler
      SetHttpHandler((request, response) => {
        const timestamp = new Date().toISOString();
        const method = request.method;
        const path = request.path;
        const source = request.address;

        // Log the request
        logWithPrefix(
          `[${timestamp}] HTTP ${method} request from ${source} to ${path}`
        );
        console.log('Headers:', JSON.stringify(request.headers));

        // Handle based on HTTP method
        switch (method) {
          case 'GET':
            handleGetRequest(request, response);
            break;
          case 'POST':
            handlePostRequest(request, response);
            break;
          default:
            sendJsonResponse(response, 405, { error: 'Method Not Allowed' });
            break;
        }
      });

      logWithPrefix(`HTTP server started successfully on ${HOST}:${PORT}`);
    } catch (error) {
      console.error(`Failed to start HTTP server: ${error}`);
      httpServerActive = false;
    }
  }

  /**
   * Stops the HTTP server
   */
  function stopHttpServer(): void {
    try {
      // Just set the flag to indicate server is no longer active
      httpServerActive = false;
      logWithPrefix('HTTP server stopped');
    } catch (error) {
      console.error(`Error stopping HTTP server: ${error}`);
    }
  }

  /**
   * Helper to send JSON responses
   */
  function sendJsonResponse(
    response: any,
    statusCode: number,
    data: any
  ): void {
    response.writeHead(statusCode, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(data));
  }

  /**
   * Handles GET requests
   */
  function handleGetRequest(request: any, response: any): void {
    if (request.path === '/') {
      sendJsonResponse(response, 200, {
        status: 'online',
        timestamp: new Date().toISOString(),
        message: 'FiveM HTTP Server is running',
      });
    } else if (request.path.startsWith('/api/')) {
      sendJsonResponse(response, 200, {
        endpoint: request.path,
        message: 'API endpoint hit',
      });
    } else {
      sendJsonResponse(response, 404, { error: 'Not Found' });
    }
  }

  /**
   * Handles POST requests
   */
  function handlePostRequest(request: any, response: any): void {
    let body = '';

    request.on('data', (chunk: string) => {
      body += chunk;
    });

    request.on('end', () => {
      logWithPrefix('Received POST data: ' + body);

      try {
        const data = JSON.parse(body);
        sendJsonResponse(response, 200, {
          success: true,
          received: data,
        });
      } catch (error) {
        sendJsonResponse(response, 400, {
          error: 'Invalid JSON',
          message: error.message,
        });
      }
    });
  }

  // Export public functions
  exports('getServerStatus', () => {
    return {
      running: httpServerActive,
      port: PORT,
      host: HOST,
    };
  });

  // Log that the resource has loaded
  logWithPrefix('HTTP Server resource loaded');
})();
