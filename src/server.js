import app from './app.js';
import { ENV } from './config/env.js';
import { checkDatabaseConnection } from './config/db.js';

const startServer = async () => {
  const PORT = ENV.PORT;

  const server = app.listen(PORT, async () => {
    console.log(`\n=================================================`);
    console.log(`[LOOKA] Backend server started successfully`);
    console.log(`[LOOKA] URL: http://localhost:${PORT}`);
    console.log(`[LOOKA] Environment: ${ENV.NODE_ENV}`);
    console.log(`[LOOKA] CORS Allowed Origin: ${ENV.CLIENT_URL}`);
    console.log(`=================================================\n`);

    // Check database connection on startup
    const isDbConnected = await checkDatabaseConnection();
    if (isDbConnected) {
      console.log('[DATABASE] PostgreSQL connected successfully');
    } else {
      console.log('[DATABASE] PostgreSQL is not connected yet (Make sure PostgreSQL is running on port 5432)');
    }
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n[LOOKA] Gracefully shutting down server...');
    server.close(() => {
      console.log('[LOOKA] Process terminated');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();