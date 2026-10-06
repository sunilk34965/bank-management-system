import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve server and client directories
const resolveDir = (sub) => {
  const direct = path.join(__dirname, sub);
  if (fs.existsSync(direct)) return direct;
  const nested = path.join(__dirname, 'bank management system 1', sub);
  if (fs.existsSync(nested)) return nested;
  return direct;
};

const serverDir = resolveDir('server');
const clientDir = resolveDir('client');

console.log('\x1b[36m====================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m       🏦 SmartBank Management System\x1b[0m');
console.log('\x1b[36m====================================================\x1b[0m');
console.log(`📁 Server Directory: ${serverDir}`);
console.log(`📁 Client Directory: ${clientDir}`);
console.log('\x1b[33m⏳ Starting Backend and Frontend servers concurrently...\x1b[0m\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const nodeCmd = 'node';

let serverProc = null;
let clientProc = null;

const cleanup = () => {
  console.log('\n\x1b[33m🛑 Shutting down SmartBank servers...\x1b[0m');
  if (serverProc) {
    if (isWindows && serverProc.pid) {
      try { spawn('taskkill', ['/pid', serverProc.pid.toString(), '/T', '/F']); } catch (e) {}
    } else {
      serverProc.kill();
    }
  }
  if (clientProc) {
    if (isWindows && clientProc.pid) {
      try { spawn('taskkill', ['/pid', clientProc.pid.toString(), '/T', '/F']); } catch (e) {}
    } else {
      clientProc.kill();
    }
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Pipe and prefix output
const pipeOutput = (proc, prefix, color) => {
  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${color}${prefix}\x1b[0m ${line}`);
      }
    }
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.error(`${color}${prefix} [ERR]\x1b[0m ${line}`);
      }
    }
  });
};

// 1. Start Server
serverProc = spawn(nodeCmd, ['server.js'], {
  cwd: serverDir,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, PORT: process.env.PORT || '5000' }
});
pipeOutput(serverProc, '[SERVER]', '\x1b[36m');

serverProc.on('close', (code) => {
  console.log(`\x1b[31m[SERVER] Exited with code ${code}\x1b[0m`);
});

// 2. Start Client after brief delay to let server initialize
setTimeout(() => {
  clientProc = spawn(npmCmd, ['run', 'dev'], {
    cwd: clientDir,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe']
  });
  pipeOutput(clientProc, '[CLIENT]', '\x1b[35m');

  clientProc.on('close', (code) => {
    console.log(`\x1b[31m[CLIENT] Exited with code ${code}\x1b[0m`);
  });

  setTimeout(() => {
    console.log('\n\x1b[32m====================================================\x1b[0m');
    console.log('\x1b[1m\x1b[32m🚀 SmartBank is Ready!\x1b[0m');
    console.log('📡 Backend API:     \x1b[4mhttp://localhost:5000/api/health\x1b[0m');
    console.log('🌐 Frontend Web App: \x1b[4mhttp://localhost:3000\x1b[0m');
    console.log('----------------------------------------------------');
    console.log('🔑 \x1b[1mDemo Credentials:\x1b[0m');
    console.log('   • Customer: customer@smartbank.com  / customer123');
    console.log('   • Cashier:  cashier@smartbank.com   / cashier123');
    console.log('   • Manager:  manager@smartbank.com   / manager123');
    console.log('   • Admin:    admin@smartbank.com     / admin123');
    console.log('\x1b[32m====================================================\x1b[0m\n');
  }, 3500);
}, 1000);
