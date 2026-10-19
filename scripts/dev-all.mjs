import { spawn, execSync } from 'node:child_process';

// 1. Ensure @iris/shared is built before starting the apps
console.log('🔨 Building @iris/shared...');
execSync('npm run build:shared', { stdio: 'inherit' });

const services = [
  { name: 'api', color: '\x1b[32m', cmd: ['run', 'dev:api'] },     // Green (port 3000)
  { name: 'app', color: '\x1b[36m', cmd: ['run', 'dev:app'] },     // Cyan (port 5173)
  { name: 'admin', color: '\x1b[35m', cmd: ['run', 'dev:admin'] }, // Magenta (port 3001)
];

const reset = '\x1b[0m';
const children = [];

function prefixStream(stream, prefix, target) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      target.write(`${prefix} ${line}\n`);
    }
  });
  stream.on('end', () => {
    if (buffer) {
      target.write(`${prefix} ${buffer}\n`);
    }
  });
}

for (const svc of services) {
  const prefix = `${svc.color}[${svc.name.padEnd(5)}]${reset}`;
  const child = spawn('npm', svc.cmd, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  prefixStream(child.stdout, prefix, process.stdout);
  prefixStream(child.stderr, prefix, process.stderr);

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`${prefix} process exited with code ${code}`);
    }
  });

  children.push(child);
}

function shutdown() {
  console.log('\n🛑 Stopping all services...');
  for (const child of children) {
    child.kill('SIGTERM');
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
