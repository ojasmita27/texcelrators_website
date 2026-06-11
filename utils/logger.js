function timestamp() {
  return new Date().toISOString();
}

function formatMeta(meta) {
  if (!meta || typeof meta !== 'object') return '';
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return '';
  }
}

function logInfo(scope, message, meta) {
  // eslint-disable-next-line no-console
  console.log(`[${timestamp()}] [${scope}] ${message}${formatMeta(meta)}`);
}

function logWarn(scope, message, meta) {
  // eslint-disable-next-line no-console
  console.warn(`[${timestamp()}] [${scope}] ${message}${formatMeta(meta)}`);
}

function logError(scope, message, meta) {
  // eslint-disable-next-line no-console
  console.error(`[${timestamp()}] [${scope}] ${message}${formatMeta(meta)}`);
}

module.exports = { logInfo, logWarn, logError };
