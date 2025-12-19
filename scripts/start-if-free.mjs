#!/usr/bin/env node
/**
 * Wrapper start script: only launches `server/index.mjs` if the port is free.
 * If port is already in use, exits gracefully (code 0) to avoid EADDRINUSE.
 */
import net from 'net';
import { spawn } from 'child_process';
import process from 'process';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

function checkPort(port, timeout = 400) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    socket.setTimeout(timeout);
    socket.once('connect', () => { settled = true; socket.destroy(); resolve(true); });
    socket.once('timeout', () => { if (!settled) { settled = true; socket.destroy(); resolve(false); } });
    socket.once('error', () => { if (!settled) { settled = true; resolve(false); } });
    socket.connect(port, '127.0.0.1');
  });
}

(async () => {
  const inUse = await checkPort(PORT);
  if (inUse) {
    console.log(`Port ${PORT} already in use — assuming server already running. Exiting.`);
    process.exit(0);
  }

  // Spawn the server in foreground and forward stdio
  const child = spawn(process.execPath, ['server/index.mjs'], { stdio: 'inherit' });

  child.on('exit', (code) => process.exit(code ?? 0));
  child.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
})();
