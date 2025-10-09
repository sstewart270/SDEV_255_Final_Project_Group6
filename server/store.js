// server/store.js
const fs = require('fs/promises');
const path = require('path');

function resolve(relPath) {
  return path.join(__dirname, relPath);
}

async function readJSON(relPath) {
  const full = resolve(relPath);
  try {
    const text = await fs.readFile(full, 'utf-8');
    return text.trim() ? JSON.parse(text) : [];
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, '[]', 'utf-8');
      return [];
    }
    throw err;
  }
}

async function writeJSON(relPath, data) {
  const full = resolve(relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readJSON, writeJSON };