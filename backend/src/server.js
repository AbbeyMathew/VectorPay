const mongoose = require('mongoose');
const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

async function main() {
  env.assertRuntime();
  await connectDB(env.mongoUri);

  const server = app.listen(env.port, () => console.log(`API listening on port ${env.port}`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
