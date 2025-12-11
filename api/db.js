const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'db.json');

async function readDB() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist or is invalid, return empty structure
    return { news: [] };
  }
}

async function writeDB(data) {
  // Note: In serverless environments this write is ephemeral and the deployment
  // directory may be read-only. Attempt the write but don't throw to avoid
  // crashing the function — callers should handle a `false` return value.
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    // Log the error for debugging, but don't rethrow.
    // On Vercel the filesystem is read-only; writes will fail.
    console.error('writeDB failed:', err && err.message ? err.message : err);
    return false;
  }
}

module.exports = { readDB, writeDB };
