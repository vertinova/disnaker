/**
 * GitHub webhook auto-deploy handler for Disnaker.
 *
 * Expected GitHub webhook:
 *   Payload URL : https://disnaker.vertinova.id/webhook
 *   Content type: application/json
 *   Secret      : WEBHOOK_SECRET from the PM2 environment
 *   Events      : push, ping
 */

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.WEBHOOK_PORT || 9000);
const HOST = process.env.WEBHOOK_HOST || '127.0.0.1';
const SECRET = process.env.WEBHOOK_SECRET;
const REPO_FULL_NAME = process.env.WEBHOOK_REPO || 'vertinova/disnaker';
const DEPLOY_BRANCH = process.env.WEBHOOK_BRANCH || 'main';

const DEPLOY_ROOT = process.env.DEPLOY_ROOT || '/var/www/disnaker';
const BACKEND_PATH = process.env.BACKEND_PATH || path.join(DEPLOY_ROOT, 'disnaker-fahri-express');
const FRONTEND_PATH = process.env.FRONTEND_PATH || path.join(DEPLOY_ROOT, 'disnaker-frontend');
const FRONTEND_PUBLIC_PATH = process.env.FRONTEND_PUBLIC_PATH || path.join(DEPLOY_ROOT, 'frontend');
const LOG_FILE = process.env.WEBHOOK_LOG_FILE || '/var/www/webhook/webhook.log';
const MAX_LOG_LINES = Number(process.env.WEBHOOK_MAX_LOG_LINES || 120);
const CMD_TIMEOUT = Number(process.env.WEBHOOK_CMD_TIMEOUT || 600_000);
const MAX_BUFFER = Number(process.env.WEBHOOK_MAX_BUFFER || 10 * 1024 * 1024);

const NODE_BIN_DIR = process.env.NODE_BIN_DIR || '';
const bin = (name) => (NODE_BIN_DIR ? path.posix.join(NODE_BIN_DIR, name) : name);

const GIT = process.env.GIT_BIN || '/usr/bin/git';
const NPM = process.env.NPM_BIN || bin('npm');
const NPX = process.env.NPX_BIN || bin('npx');
const NODE = process.env.NODE_BIN || bin('node');
const PM2 = process.env.PM2_BIN || bin('pm2');
const NGINX = process.env.NGINX_BIN || '/usr/sbin/nginx';
const NGINX_SITE = process.env.NGINX_SITE || 'disnaker.vertinova.id';
const WEBHOOK_PROCESS = process.env.WEBHOOK_PROCESS || 'github-webhook';

const { max_memory_restart: _maxMemoryRestart, ...cleanEnv } = process.env;
const EXEC_ENV = {
  ...cleanEnv,
  PATH: NODE_BIN_DIR
    ? `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${NODE_BIN_DIR}`
    : process.env.PATH,
  HOME: process.env.HOME || '/root',
  SHELL: '/bin/bash',
};

const deployLock = {};

const steps = [
  { name: 'Fetch repository', cwd: DEPLOY_ROOT, cmd: `${GIT} fetch origin` },
  { name: 'Reset repository', cwd: DEPLOY_ROOT, cmd: `${GIT} reset --hard origin/${DEPLOY_BRANCH}` },
  { name: 'Install backend dependencies', cwd: BACKEND_PATH, cmd: `${NPM} install --omit=dev` },
  { name: 'Generate Prisma client', cwd: BACKEND_PATH, cmd: `${NPX} prisma generate` },
  {
    name: 'Run database auto migration',
    cwd: BACKEND_PATH,
    cmd: `/bin/bash -lc 'if [ -f database-express/auto-migrate.js ]; then ${NODE} database-express/auto-migrate.js || echo "auto-migrate failed, continuing deploy"; else echo "auto-migrate.js not found, skipped"; fi'`,
  },
  { name: 'Install frontend dependencies', cwd: FRONTEND_PATH, cmd: `${NPM} install --include=dev` },
  { name: 'Build frontend', cwd: FRONTEND_PATH, cmd: `${NPM} run build` },
  {
    name: 'Publish frontend build',
    cwd: FRONTEND_PATH,
    cmd: `/bin/bash -lc 'mkdir -p "${FRONTEND_PUBLIC_PATH}" && cp -a dist/. "${FRONTEND_PUBLIC_PATH}/"'`,
  },
  {
    name: 'Ensure Nginx webhook route',
    cwd: BACKEND_PATH,
    cmd: '/bin/bash scripts/ensure-nginx-webhook.sh',
  },
  { name: 'Reload Nginx', cwd: BACKEND_PATH, cmd: `${NGINX} -t && ${NGINX} -s reload` },
  {
    name: 'Copy webhook handler',
    cwd: BACKEND_PATH,
    cmd: '/bin/bash -lc \'mkdir -p /var/www/webhook && cp -f webhook-handler.js /var/www/webhook/webhook-handler.js\'',
  },
  { name: 'Reload backend process', cwd: BACKEND_PATH, cmd: `${PM2} startOrReload ecosystem.config.js --update-env` },
  {
    name: 'Reload webhook process',
    cwd: BACKEND_PATH,
    cmd: `/bin/bash -lc '(sleep 3 && ${PM2} restart ${WEBHOOK_PROCESS} --update-env) >/tmp/disnaker-webhook-restart.log 2>&1 &'`,
  },
];

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  process.stdout.write(line);

  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line);
  } catch {
    // Keep the webhook alive even when the log file cannot be written.
  }
}

function writeJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function writeText(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > MAX_BUFFER) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });

    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function verifySignature(payload, signature) {
  if (!SECRET || !signature) return false;

  const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const received = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (received.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(received, expectedBuffer);
}

function runStep(step, index) {
  return new Promise((resolve, reject) => {
    const label = `[${index + 1}/${steps.length}] ${step.name}`;
    log(`${label}: ${step.cmd} (cwd: ${step.cwd})`);

    exec(step.cmd, {
      cwd: step.cwd,
      env: EXEC_ENV,
      shell: '/bin/bash',
      timeout: CMD_TIMEOUT,
      maxBuffer: MAX_BUFFER,
    }, (error, stdout, stderr) => {
      if (stdout) log(`${label} stdout: ${stdout.slice(-2000)}`);
      if (stderr) log(`${label} stderr: ${stderr.slice(-2000)}`);

      if (error) {
        log(`${label} failed: ${error.message}`);
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function runDeployment(repoName) {
  deployLock[repoName] = Date.now();
  log(`=== Deployment START: ${repoName} ===`);

  try {
    for (let i = 0; i < steps.length; i += 1) {
      await runStep(steps[i], i);
    }

    log(`=== Deployment END: ${repoName} ===`);
  } catch (error) {
    log(`=== Deployment FAILED: ${repoName}: ${error.message} ===`);
  } finally {
    delete deployLock[repoName];
  }
}

function handleLogs(_req, res) {
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    writeText(res, 200, content.trim().split('\n').slice(-MAX_LOG_LINES).join('\n'));
  } catch {
    writeText(res, 200, 'No logs found');
  }
}

function handleStatus(_req, res) {
  exec(`${PM2} jlist`, { env: EXEC_ENV, maxBuffer: MAX_BUFFER }, (error, stdout) => {
    if (error) {
      writeJson(res, 500, { success: false, error: error.message });
      return;
    }

    try {
      const processes = JSON.parse(stdout).map((processInfo) => ({
        name: processInfo.name,
        status: processInfo.pm2_env?.status,
        restarts: processInfo.pm2_env?.restart_time,
        uptime: processInfo.pm2_env?.pm_uptime
          ? new Date(processInfo.pm2_env.pm_uptime).toISOString()
          : null,
      }));

      writeJson(res, 200, {
        success: true,
        repo: REPO_FULL_NAME,
        branch: DEPLOY_BRANCH,
        deploying: Object.keys(deployLock),
        processes,
      });
    } catch {
      writeText(res, 200, stdout.slice(0, 2000));
    }
  });
}

async function handleWebhook(req, res) {
  let body;

  try {
    body = await readBody(req);
  } catch (error) {
    log(`Rejected: ${error.message}`);
    writeText(res, 413, 'Payload too large');
    return;
  }

  if (!verifySignature(body, req.headers['x-hub-signature-256'])) {
    log('Rejected: invalid signature or WEBHOOK_SECRET is not configured');
    writeText(res, 401, 'Unauthorized');
    return;
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    writeText(res, 400, 'Bad Request');
    return;
  }

  const event = req.headers['x-github-event'];
  if (event === 'ping') {
    log('Ping received - webhook OK');
    writeText(res, 200, 'Pong');
    return;
  }

  if (event !== 'push') {
    log(`Ignored: unsupported event "${event}"`);
    writeJson(res, 200, { ignored: true, reason: 'unsupported event' });
    return;
  }

  const repoName = payload.repository?.full_name;
  const branch = payload.ref?.replace('refs/heads/', '');
  const pusher = payload.pusher?.name || 'unknown';

  log(`Push received - repo: ${repoName}, branch: ${branch}, by: ${pusher}`);

  if (repoName !== REPO_FULL_NAME) {
    log(`Ignored: repo "${repoName}" (expected "${REPO_FULL_NAME}")`);
    writeJson(res, 200, { ignored: true, reason: 'repo mismatch' });
    return;
  }

  if (branch !== DEPLOY_BRANCH) {
    log(`Ignored: branch "${branch}" (expected "${DEPLOY_BRANCH}")`);
    writeJson(res, 200, { ignored: true, reason: 'branch mismatch' });
    return;
  }

  if (deployLock[repoName]) {
    log(`Skipped: deployment already in progress for ${repoName}`);
    writeJson(res, 200, { skipped: true, reason: 'deployment in progress' });
    return;
  }

  writeJson(res, 200, { deploying: true, repo: repoName, branch });
  runDeployment(repoName);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/webhook/logs') return handleLogs(req, res);
  if (req.method === 'GET' && url.pathname === '/webhook/status') return handleStatus(req, res);
  if (req.method === 'POST' && url.pathname === '/webhook') return handleWebhook(req, res);

  writeText(res, 404, 'Not Found');
});

server.listen(PORT, HOST, () => {
  log(`Webhook handler listening on ${HOST}:${PORT}`);
  if (!SECRET) {
    log('WARNING: WEBHOOK_SECRET is not configured; GitHub webhook requests will be rejected.');
  }
});
