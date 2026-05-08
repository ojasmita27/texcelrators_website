require('dotenv').config({ override: true });

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { connectMongo } = require('./config/db');

const { authRoutes } = require('./routes/auth.routes');
const { memberRoutes } = require('./routes/member.routes');
const { paymentRoutes } = require('./routes/payment.routes');
const { expenseRoutes } = require('./routes/expense.routes');
const { dashboardRoutes } = require('./routes/dashboard.routes');

const app = express();

let httpServer = null;
let memoryServer = null;
let isShuttingDown = false;

app.use(cors());
app.use(morgan('dev'));

// JSON for most routes; payments use multipart/form-data for receipt upload
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve the frontend files from the project root
app.use(express.static(path.join(process.cwd())));

// Serve uploaded receipts (if you prefer private receipts, remove this and serve via a protected route)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'login.html'));
});

app.get('/setup-admin', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'setup-admin.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dashboard.html'));
});

// Health check (required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes (clean REST structure)
app.use('/auth', authRoutes);
app.use('/members', memberRoutes);
app.use('/payments', paymentRoutes);
app.use('/expenses', expenseRoutes);
app.use('/dashboard', dashboardRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const message = err && err.message ? err.message : 'Server error';
  const status = message.includes('Unsupported receipt file type') ? 400 : 500;
  res.status(status).json({ message });
});

async function start() {
  const configuredPort = Number(process.env.PORT || 3000);
  const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  const retryDelayMs = Number(process.env.DB_RETRY_DELAY_MS || 5000);
  const autoPortFallback = !isProduction && String(process.env.AUTO_PORT_FALLBACK || 'false').toLowerCase() === 'true';
  const maxPortTries = Number(process.env.PORT_FALLBACK_TRIES || 10);

  // Primary DB is always the real MongoDB URI (MongoDB Atlas in production).
  const mongoUri = process.env.MONGODB_URI;
  const allowInMemoryFallback = !isProduction && process.env.USE_IN_MEMORY_DB === 'true';

  // eslint-disable-next-line no-console
  console.log(`[startup] NODE_ENV=${process.env.NODE_ENV || 'development'} PORT=${configuredPort}`);

  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log('[mongo] connected');
  });

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.log('[mongo] disconnected');
  });

  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[mongo] error:', err && err.message ? err.message : err);
  });

  memoryServer = null;

  async function connectWithInMemoryFallback() {
    try {
      // eslint-disable-next-line no-console
      console.log('[startup] Connecting to MongoDB...');
      await connectMongo(mongoUri);
      // eslint-disable-next-line no-console
      console.log('[startup] MongoDB connected');
      return;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[startup] MongoDB connection failed:', err && err.message ? err.message : err);

      if (!allowInMemoryFallback) {
        throw err;
      }

      // eslint-disable-next-line no-console
      console.log('[startup] Falling back to in-memory MongoDB (dev only)...');

      const memoryTimeoutMs = Number(process.env.MEMORY_DB_START_TIMEOUT_MS || 60_000);
      const createPromise = MongoMemoryServer.create({
        instance: { dbName: 'texcelerators' }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timed out starting mongodb-memory-server')), memoryTimeoutMs);
      });

      memoryServer = await Promise.race([createPromise, timeoutPromise]);
      const memUri = memoryServer.getUri('texcelerators');

      // eslint-disable-next-line no-console
      console.log('[startup] In-memory MongoDB started');
      await connectMongo(memUri);
      // eslint-disable-next-line no-console
      console.log('[startup] Connected to in-memory MongoDB');
    }
  }

  if (!mongoUri && !allowInMemoryFallback) {
    throw new Error('MONGODB_URI is not set (required for production). Set USE_IN_MEMORY_DB=true only for local dev fallback.');
  }

  await connectWithInMemoryFallback();

  const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    if (httpServer) {
      await new Promise((resolve) => {
        httpServer.close(() => resolve());
        // if close never calls back, don't hang forever
        setTimeout(resolve, 5000).unref?.();
      });
      httpServer = null;
    }

    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore
    }
    if (memoryServer) {
      try {
        await memoryServer.stop();
      } catch (_) {
        // ignore
      }
      memoryServer = null;
    }
  };

  const handleSignal = (signal, exitCode) => async () => {
    // eslint-disable-next-line no-console
    console.log(`[startup] Received ${signal}. Shutting down...`);
    await shutdown();
    process.exit(exitCode);
  };

  process.on('SIGINT', handleSignal('SIGINT', 0));
  process.on('SIGTERM', handleSignal('SIGTERM', 0));

  // Nodemon uses SIGUSR2 by default for restarts. Ensure we close the port before restart.
  process.once('SIGUSR2', async () => {
    // eslint-disable-next-line no-console
    console.log('[startup] Nodemon restart requested (SIGUSR2). Closing server...');
    await shutdown();
    process.kill(process.pid, 'SIGUSR2');
  });

  async function listenOnPort(portToTry) {
    return new Promise((resolve, reject) => {
      const s = app.listen(portToTry, () => resolve(s));
      s.on('error', (err) => reject(err));
    });
  }

  let activePort = configuredPort;
  let lastErr = null;

  for (let i = 0; i < Math.max(1, maxPortTries); i += 1) {
    const portToTry = configuredPort + i;
    try {
      // eslint-disable-next-line no-console
      console.log(`[startup] Starting HTTP server on port ${portToTry}...`);
      httpServer = await listenOnPort(portToTry);
      activePort = portToTry;
      break;
    } catch (err) {
      lastErr = err;
      const code = err && err.code ? String(err.code) : '';
      // eslint-disable-next-line no-console
      console.error('[startup] Server listen error:', err && err.message ? err.message : err);

      if (code === 'EADDRINUSE' && autoPortFallback) {
        // eslint-disable-next-line no-console
        console.log(`[startup] Port ${portToTry} is busy. Trying ${portToTry + 1}...`);
        continue;
      }

      await shutdown();
      throw err;
    }
  }

  if (!httpServer) {
    await shutdown();
    const msg = lastErr && lastErr.message ? lastErr.message : String(lastErr || 'Unknown listen failure');
    throw new Error(`Failed to bind HTTP server (starting at ${configuredPort}): ${msg}`);
  }

  if (activePort !== configuredPort) {
    // eslint-disable-next-line no-console
    console.log(`[startup] Bound to fallback port ${activePort} (configured ${configuredPort})`);
  }

  // eslint-disable-next-line no-console
  console.log(`[startup] Server running on port ${activePort}`);
  // eslint-disable-next-line no-console
  console.log(`[startup] API_BASE=http://localhost:${activePort}`);
}

function isRetryableMongoStartupError(err) {
  const msg = String((err && err.message) || err || '');
  // Retry on network/server selection issues, but not on parse/auth/config errors.
  return /server selection|timed out|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|TLS|network|Could not connect to any servers|whitelist|IP that isn't whitelisted/i.test(
    msg
  );
}

async function boot() {
  try {
    await start();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[startup] Failed to start server:', err && err.message ? err.message : err);

    const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    const retryDelayMs = Number(process.env.DB_RETRY_DELAY_MS || 5000);

    if (isProduction) {
      process.exit(1);
      return;
    }

    // In dev, avoid nodemon crash loops. Retry only for likely-transient DB errors.
    if (isRetryableMongoStartupError(err)) {
      // eslint-disable-next-line no-console
      console.log(`[startup] Retrying in ${retryDelayMs}ms...`);
      setTimeout(() => {
        boot().catch(() => {
          // boot logs its own errors
        });
      }, retryDelayMs);
    } else {
      // eslint-disable-next-line no-console
      console.log('[startup] Not retrying (check your .env MONGODB_URI / credentials / IP allowlist).');
    }
  }
}

boot().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[startup] Fatal boot error:', err);
  process.exit(1);
});
