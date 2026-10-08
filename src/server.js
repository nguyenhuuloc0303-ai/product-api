require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Attempt MongoDB connection on boot
    await connectDB();
  } catch (err) {
    console.error('[Boot Warning] Could not connect to MongoDB initially. API will still start, healthcheck will reflect DEGRADED until DB is up.');
  }

  const server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Product API is running on port: ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/health`);
    console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
    console.log(`=========================================`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[${signal}] Shutting down server gracefully...`);
    server.close(async () => {
      await disconnectDB();
      console.log('Server and database connections closed. Bye!');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
