// server/store.js
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'courses.json');

function readCourses() {
  try {
    const txt = fs.readFileSync(dataPath, 'utf-8');
    return txt.trim() ? JSON.parse(txt) : [];
  } catch (err) {
    if (err.code === 'ENOENT') {
      fs.writeFileSync(dataPath, '[]', 'utf-8');
      return [];
    }
    throw err;
  }
}

function writeCourses(courses) {
  fs.writeFileSync(dataPath, JSON.stringify(courses, null, 2), 'utf-8');
}

module.exports = { readCourses, writeCourses, dataPath };
