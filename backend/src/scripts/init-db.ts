import dotenv from 'dotenv';

dotenv.config();

import { initDb } from '../db';

const run = async () => {
  try {
    await initDb();
    console.log('DB init completed.');
    process.exit(0);
  } catch (error) {
    console.error('DB init failed:', error);
    process.exit(1);
  }
};

run();
