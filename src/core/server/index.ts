/// <reference types="@citizenfx/server" />

import * as http from 'http';

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Home Page\n');
  } else if (req.url === '/about') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('About Page\n');
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Page Not Found\n');
  }
});

server.listen(3414, () => {
  console.log('Server running on port 3414');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
