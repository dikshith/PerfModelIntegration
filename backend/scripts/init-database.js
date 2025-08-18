#!/usr/bin/env node

/**
 * Database Initialization Script
 * Run this script to ensure the database is properly set up with default configurations
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runInitialization() {
  try {
    console.log('🚀 Starting database initialization...');

    const backendDir = path.join(__dirname, '..');
    const distScript = path.join(backendDir, 'dist', 'database', 'initialize.js');
    const tsScript = path.join(backendDir, 'src', 'database', 'initialize.ts');

    // Prefer compiled JS if present (Heroku buildpack runs build already)
    const hasDist = fs.existsSync(distScript);
    const command = hasDist
      ? `node "${distScript}"`
      : `npx ts-node -r tsconfig-paths/register "${tsScript}"`;

    console.log('🔄 Initializing database using:', hasDist ? 'dist JS' : 'ts-node');

    execSync(command, {
      stdio: 'inherit',
      cwd: backendDir,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' },
    });

    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    // Do not exit with failure in production to avoid dyno crash; app can start without seed
    if ((process.env.NODE_ENV || '').toLowerCase() !== 'development') {
      console.warn('⚠️ Continuing startup despite initialization error.');
      return;
    }
    process.exit(1);
  }
}

runInitialization();
