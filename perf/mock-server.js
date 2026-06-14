const http = require('http');
const { URL } = require('url');

const port = process.env.PORT || 8080;

function parseQuery(reqUrl) {
  const u = new URL(reqUrl, `http://localhost:${port}`);
  return Object.fromEntries(u.searchParams.entries());
}

const server = http.createServer((req, res) => {
  // Set headers to enable keep-alive and close stale connections
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=100');
  
  const pathname = new URL(req.url, `http://localhost:${port}`).pathname;

  if (pathname === '/actuator/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP' }));
    return;
  }

  if (pathname === '/multas/consulta') {
    const q = parseQuery(req.url);
    // find first param
    const keys = Object.keys(q);
    if (keys.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'missing query param' }));
      return;
    }

    const tipo = keys[0];
    const valor = q[tipo];

    // simple deterministic response
    const response = {
      tipo,
      valor,
      resultados: [
        { id: 1, descripcion: 'Multa simulada', monto: 10000 }
      ]
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

// Configure server to handle high concurrency
server.maxConnections = 1000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Allow port reuse if in TIME_WAIT state
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use, attempting to reuse...`);
    // Try again after a delay
    setTimeout(() => {
      server.close();
      server.listen(port, '0.0.0.0');
    }, 1000);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Mock server listening on http://localhost:${port}`);
});

// graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down mock server...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
