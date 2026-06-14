const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const scenario = process.argv[2] || process.env.SCENARIO || 'smoke';
const port = process.env.PORT || '8087';
const dataFile = process.env.DATA_FILE || path.resolve('data', 'consultas.json');
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
const resultsDir = path.resolve(__dirname, 'results');
const mockServerPath = path.resolve(__dirname, 'mock-server.js');
const k6ScriptPath = path.resolve(__dirname, 'scripts', 'multas_k6.js');

if (!fs.existsSync(mockServerPath)) {
  console.error(`Mock server script not found: ${mockServerPath}`);
  process.exit(1);
}

if (!fs.existsSync(k6ScriptPath)) {
  console.error(`k6 script not found: ${k6ScriptPath}`);
  process.exit(1);
}

if (!fs.existsSync(path.resolve(dataFile))) {
  console.error(`Data file not found: ${dataFile}`);
  process.exit(1);
}

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

function waitForServerReady(port, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const req = http.get(`http://localhost:${port}/actuator/health`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve(true);
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
      });

      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
      });

      req.setTimeout(1000, () => {
        req.abort();
      });
    }, 250);
  });
}

function runCommand(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

async function main() {
  const mock = spawn(process.execPath, [mockServerPath], {
    stdio: 'inherit',
    env: { ...process.env, PORT: port },
  });

  let mockStopped = false;
  const cleanup = () => {
    if (mockStopped) return;
    mockStopped = true;
    if (!mock.killed) {
      mock.kill('SIGINT');
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    cleanup();
    process.exit(1);
  });

  process.on('exit', cleanup);

  const ready = await waitForServerReady(port, 15000);
  if (!ready) {
    console.warn(`Warning: mock server did not respond on http://localhost:${port}/actuator/health within the timeout.`);
  }

  try {
    await runCommand('k6', [
      'run',
      k6ScriptPath,
      '--env', `SCENARIO=${scenario}`,
      '--env', `BASE_URL=${baseUrl}`,
      '--env', `DATA_FILE=${dataFile}`,
      '-o', `json=${path.join(resultsDir, `${scenario}.json`)}`,
    ], {
      BASE_URL: baseUrl,
      DATA_FILE: dataFile,
      SCENARIO: scenario,
      PORT: port,
    });
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
