/**
 * Runs the API with a local MongoDB started by mongodb-memory-server, so you can try the app
 * without installing MongoDB or creating an Atlas cluster.
 *
 * Data is saved in server/.data/db and survives restarts.
 * Delete that folder (or run with FRESH_DB=1) to start from an empty database.
 *
 *   npm run dev:memory
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const app = require('../src/app');

const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, '..', '.data', 'db');

(async () => {
  if (process.env.FRESH_DB === '1') fs.rmSync(DB_PATH, { recursive: true, force: true });
  fs.mkdirSync(DB_PATH, { recursive: true });

  // wiredTiger + a fixed dbPath = data is kept on disk between runs.
  const mongod = await MongoMemoryServer.create({ instance: { dbPath: DB_PATH, storageEngine: 'wiredTiger' } });
  await mongoose.connect(mongod.getUri('taskflow'));
  console.log(`Local MongoDB started, data saved in ${DB_PATH}`);
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

  const shutdown = async () => {
    await mongoose.disconnect();
    await mongod.stop({ doCleanup: false }); // keep the data folder
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
