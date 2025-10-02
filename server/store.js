const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'courses.json');

// Load courses
function loadCourses() {
  if (!fs.existsSync(dataFile)) {
    return [];
  }
  const data = fs.readFileSync(dataFile);
  return JSON.parse(data);
}

// Save courses
function saveCourses(courses) {
  fs.writeFileSync(dataFile, JSON.stringify(courses, null, 2));
}

module.exports = {
  loadCourses,
  saveCourses
};
