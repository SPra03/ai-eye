#!/usr/bin/env node

/**
 * Simple HTTP server for testing AI Eye preview
 * Run with: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = parseInt(process.env.PORT) || 5173;
const HOST = process.env.HOST || 'localhost';
const MAX_PORT_TRIES = 10;

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Serve index.html for root path
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // Determine content type
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  const contentType = contentTypes[ext] || 'text/plain';

  // Read and serve file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>File not found</p>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      // Add CORS headers for cross-origin requests
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end(content, 'utf-8');
    }
  });
});

// Try to listen on port, with fallback to next ports if occupied
function startServer(port, tries = 0) {
  if (tries >= MAX_PORT_TRIES) {
    console.error(`\n❌ Could not find an available port after ${MAX_PORT_TRIES} attempts.`);
    console.error('   Please free up some ports or specify a custom port:');
    console.error('   PORT=8888 node server.js\n');
    process.exit(1);
  }

  server.listen(port, HOST, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   AI Eye Test Server                     ║');
    console.log('╚═══════════════════════════════════════════════╝');
    console.log('');
    console.log(`  Server running at: http://${HOST}:${port}`);
    console.log('');
    console.log('  To test AI Eye preview:');
    console.log('  1. Press F5 to launch Extension Development Host');
    console.log('  2. Run: AI Eye: Open Live Preview');
    if (port !== 5173) {
      console.log(`  3. Change URL to: http://${HOST}:${port}`);
      console.log('  4. The test page should appear in the preview!');
    } else {
      console.log('  3. The test page should appear in the preview!');
    }
    console.log('');
    console.log('  Press Ctrl+C to stop the server');
    console.log('');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is already in use, trying ${port + 1}...`);
      startServer(port + 1, tries + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

// Start the server
startServer(PORT);

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
