const express = require('express');
const path = require('path');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.static(path.join(process.cwd())));

app.get('/', (req, res) => res.sendFile(path.join(process.cwd(), 'index.html')));

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[static-server] Serving static site at http://localhost:${port}`);
});

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[static-server] Uncaught exception:', err && err.message ? err.message : err);
  process.exit(1);
});
