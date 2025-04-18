a fivem development framework including react and tailwindcss and supporting hot reloading for both the webview and the scripts.
  
## Development with Docker

The hot-reload server listens on WebSocket port 3414 by default (ws://localhost:3414). When running the FiveM server inside Docker, ensure this port is exposed so that hot-reload events can be correctly transmitted.
In your `docker-compose.yml`, add the following under the `fivem` service:
```yaml
services:
  fivem:
    ports:
      - '3414:3414/tcp'  # Expose hot-reload WebSocket port
```
