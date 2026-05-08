const mongoose = require('mongoose');

/**
 * Connect to MongoDB with sensible timeouts and a clear error.
 *
 * Notes:
 * - `serverSelectionTimeoutMS` prevents "hang forever" when Mongo is unreachable.
 * - In production, you should provide a real `MONGODB_URI` (MongoDB Atlas).
 */
async function connectMongo(mongoUri) {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  const serverSelectionTimeoutMS = Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || 10_000);
  const connectTimeoutMS = Number(process.env.DB_CONNECT_TIMEOUT_MS || 10_000);

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS,
    connectTimeoutMS
  });

  return mongoose.connection;
}

module.exports = { connectMongo };
