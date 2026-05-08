#!/usr/bin/env node
/* eslint-disable no-console */

const { execSync } = require('child_process');
const path = require('path');

function usage() {
  console.log('Usage: node scripts/kill-port.js <port> [--force]');
  console.log('  --force  Kill even if process is not recognized as Node/nodemon');
}

function toLines(s) {
  return String(s || '')
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter(Boolean);
}

function safeExec(command) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
  } catch (err) {
    const stdout = err && err.stdout ? err.stdout.toString('utf8') : '';
    const stderr = err && err.stderr ? err.stderr.toString('utf8') : '';
    return `${stdout}\n${stderr}`.trim();
  }
}

function getWindowsPidsForPort(port) {
  const out = safeExec('netstat -ano -p tcp');
  const pids = new Set();

  for (const line of toLines(out)) {
    // Example:
    // TCP    0.0.0.0:5000           0.0.0.0:0              LISTENING       12345
    // TCP    [::]:5000              [::]:0                 LISTENING       12345
    if (!/^TCP\s+/i.test(line)) continue;
    if (!line.includes(`:${port}`)) continue;
    if (!/\sLISTENING\s/i.test(line)) continue;

    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (/^\d+$/.test(pid)) pids.add(pid);
  }

  return [...pids];
}

function getWindowsCommandLine(pid) {
  // Prefer PowerShell CIM (works on modern Windows).
  const ps = [
    'powershell -NoProfile -Command',
    `"(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`
  ].join(' ');

  const out = safeExec(ps);
  const firstLine = toLines(out)[0] || '';
  if (firstLine) return firstLine;

  // Fallback to wmic (older, but still present on many machines)
  const wmicOut = safeExec(`wmic process where (ProcessId=${pid}) get CommandLine /value`);
  const match = String(wmicOut).match(/CommandLine=(.*)/i);
  return match ? match[1].trim() : '';
}

function killWindowsPid(pid) {
  // /T: kill child processes, /F: force
  safeExec(`taskkill /PID ${pid} /T /F`);
}

function isProbablyNodeProcess(cmdline, projectRoot) {
  const cl = String(cmdline || '').toLowerCase();
  const root = String(projectRoot || '').toLowerCase();
  if (!cl) return false;
  if (!cl.includes('node') && !cl.includes('nodemon')) return false;
  // Try to ensure it's from this repo (avoid killing random node services)
  return cl.includes('server.js') || (root && cl.includes(root));
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    usage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const port = Number(args[0]);
  const force = args.includes('--force');

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    console.error('[kill-port] Invalid port:', args[0]);
    usage();
    process.exit(1);
  }

  if (process.platform !== 'win32') {
    console.error('[kill-port] This helper is currently implemented for Windows only.');
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, '..');
  const pids = getWindowsPidsForPort(port);

  if (pids.length === 0) {
    console.log(`[kill-port] Port ${port} is free.`);
    process.exit(0);
  }

  console.log(`[kill-port] Port ${port} is in use by PID(s): ${pids.join(', ')}`);

  let killedAny = false;
  let skippedAny = false;

  for (const pid of pids) {
    const cmdline = getWindowsCommandLine(pid);
    const okToKill = force || isProbablyNodeProcess(cmdline, projectRoot);

    if (!okToKill) {
      skippedAny = true;
      console.warn(`[kill-port] Skipping PID ${pid} (not recognized as this Node server).`);
      if (cmdline) console.warn(`[kill-port] CommandLine: ${cmdline}`);
      continue;
    }

    console.log(`[kill-port] Killing PID ${pid}...`);
    killWindowsPid(pid);
    killedAny = true;
  }

  if (skippedAny && !killedAny) {
    console.error(`[kill-port] Port ${port} is still in use (non-node or unknown process).`);
    console.error('[kill-port] Close it manually or run with --force if you are sure.');
    process.exit(1);
  }

  console.log(`[kill-port] Done.`);
  process.exit(0);
}

main();
