#!/usr/bin/env node

import { spawn } from 'child_process';

// Run the database migration
const process = spawn('npx', ['drizzle-kit', 'push'], { 
  stdio: 'inherit',
  shell: true
});

process.on('close', (code) => {
  console.log(`Migration process exited with code ${code}`);
});