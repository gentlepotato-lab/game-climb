import dotenv from 'dotenv';

dotenv.config();

import { app } from './app';
import { config } from './config';
import { initDbIfNeeded } from './db';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

const start = async () => {
  try {
    await initDbIfNeeded();
    app.listen(config.port, () => {
      console.log(`MongBori server listening on ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
