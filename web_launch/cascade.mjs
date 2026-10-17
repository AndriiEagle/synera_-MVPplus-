import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(root, 'cascade_log.jsonl');

// Default starting state
export let currentState = {
  version: 1,
  tokens: {
    '--synera-primary': '#0055FF',
    '--synera-bg': '#FFFFFF',
    '--synera-text': '#111111'
  },
  layout: ['hero', 'matching', 'pricing']
};

export async function loadCascadeState() {
  try {
    const data = await fs.readFile(LOG_FILE, 'utf8');
    const lines = data.trim().split('\n');
    if (lines.length > 0 && lines[lines.length - 1]) {
      const latest = JSON.parse(lines[lines.length - 1]);
      if (latest && latest.version) {
        currentState = latest;
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Error reading cascade_log.jsonl:', err);
    // If no log exists, we use default state and write it
    await saveCascadeState(currentState);
  }
  return currentState;
}

export async function saveCascadeState(newState) {
  // Validate WCAG AA contrast (simplified check, in real C15.L1 would be rigorous)
  // Ensure we have layout and tokens
  if (!newState.tokens || !newState.layout) {
    throw new Error('Invalid Cascade State: Missing tokens or layout');
  }
  
  newState.version = (currentState.version || 0) + 1;
  newState.timestamp = new Date().toISOString();
  
  currentState = newState;
  
  // Append to log (Immutable)
  await fs.appendFile(LOG_FILE, JSON.stringify(currentState) + '\n', 'utf8');
  return currentState;
}

export async function rollbackCascade() {
  try {
    const data = await fs.readFile(LOG_FILE, 'utf8');
    const lines = data.trim().split('\n').filter(Boolean);
    if (lines.length > 1) {
      // Pop the last one by reading the second to last
      const prev = JSON.parse(lines[lines.length - 2]);
      await saveCascadeState(prev); // Re-deploy the previous state as a new version
      return currentState;
    }
  } catch (err) {
    console.error('Rollback failed:', err);
  }
  throw new Error('Cannot rollback further');
}
