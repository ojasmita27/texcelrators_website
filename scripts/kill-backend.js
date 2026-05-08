#!/usr/bin/env node
/* eslint-disable no-console */

const { execSync } = require('child_process');
const path = require('path');

function safeExec(command) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
  } catch (err) {
    const stdout = err && err.stdout ? err.stdout.toString('utf8') : '';
    const stderr = err && err.stderr ? err.stderr.toString('utf8') : '';
    return `${stdout}\n${stderr}`.trim();
  }
}

function getProcessLines() {
  const command = 'powershell -NoProfile -Command "Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine | Format-Table -HideTableHeaders | Out-String -Width 4096"';
  return safeExec(command)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function looksLikeThisRepoProcess(cmdline, projectRoot) {
  const normalized = String(cmdline || '').toLowerCase();
  const root = String(projectRoot || '').toLowerCase().replace(/\\/g, '/');

  if (!normalized) return false;
  if (normalized.includes('kill-backend') || normalized.includes('scripts/kill-backend.js')) return false;
  if (normalized.includes('tsserver.js')) return false;

  // Only target this repo's backend entrypoints or nodemon wrappers.
  return normalized.includes('server.js') || normalized.includes('nodemon.js') || normalized.includes(`${root}/server.js`);
}

function main() {
  if (process.platform !== 'win32') {
    console.error('[kill-backend] Windows only.');
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, '..');
  const lines = getProcessLines();
  const matches = [];

  for (const line of lines) {
    const pidMatch = line.match(/^(\d+)\s+(.*)$/);
    if (!pidMatch) continue;

    const pid = pidMatch[1];
    const cmdline = pidMatch[2];
    if (looksLikeThisRepoProcess(cmdline, projectRoot)) {
      matches.push({ pid, cmdline });
    }
  }

  if (matches.length === 0) {
    console.log('[kill-backend] No matching backend processes found.');
    process.exit(0);
  }

  console.log(`[kill-backend] Found ${matches.length} matching process(es):`);
  matches.forEach((match) => console.log(`- PID ${match.pid}: ${match.cmdline}`));

  for (const match of matches) {
    console.log(`[kill-backend] Killing PID ${match.pid}...`);
    safeExec(`taskkill /PID ${match.pid} /T /F`);
  }

  console.log('[kill-backend] Cleanup complete.');
}

main();
