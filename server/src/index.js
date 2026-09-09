import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { api } from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '64kb' }));

app.use('/api', api);

// Serve the built client from the same process — one deployable unit.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist, { maxAge: '1h', index: false }));
app.get(/^(?!\/api).*/, (_req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => (err ? next() : null));
});

app.use((err, _req, res, _next) => {
  const status = err.status || (/UNSUPPORTED_PAIR|INVALID/.test(err.message) ? 400 : 502);
  console.error('[fxlens]', err.message);
  res.status(status).json({ error: err.message || 'INTERNAL_ERROR' });
});

const server = app.listen(config.port, () => {
  console.log(`\n  FXLens API  →  http://localhost:${config.port}`);
  console.log(`  Provider    →  ExchangeRate-API${config.apiKey ? ' (keyed)' : ' (open access)'} + Frankfurter/ECB\n`);
});

// Without this the EADDRINUSE surfaces as an unhandled 'error' event and a
// 20-line stack trace that buries the one thing worth knowing: the port is
// taken. Print the fix instead.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ✗ Port ${config.port} is already in use.\n`);
    console.error('  Another FXLens server is probably still running. Either:');
    console.error(`    • Free the port  →  npx kill-port ${config.port}`);
    console.error(`         (Windows)   →  Get-NetTCPConnection -LocalPort ${config.port} -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`);
    console.error(`    • Use another    →  PORT=${config.port + 1} npm run dev\n`);
    process.exit(1);
  }
  throw err;
});

// Close the listener on Ctrl+C so the port is released immediately rather than
// lingering in TIME_WAIT.
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
