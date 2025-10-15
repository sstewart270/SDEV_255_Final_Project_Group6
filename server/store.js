// server/store.js
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const COURSES_PATH = path.join(DATA_DIR, "courses.json");
const SCHEDULES_PATH = path.join(DATA_DIR, "schedules.json");

function readJson(p, fallback) {
  try {
    if (!fs.existsSync(p)) return fallback;
    const txt = fs.readFileSync(p, "utf8");
    return txt.trim() ? JSON.parse(txt) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

/* ---------- Users ---------- */
function getUsers() { return readJson(USERS_PATH, []); }

/* ---------- Courses ---------- */
function getCourses() { return readJson(COURSES_PATH, []); }
function saveCourses(courses) { writeJson(COURSES_PATH, courses); }

/* ---------- Schedules ---------- */
/* Shape in schedules.json:
   {
     "<userId>": ["<courseId>", ...]
   }
*/
function getSchedules() {
  const data = readJson(SCHEDULES_PATH, {});
  return data && typeof data === "object" ? data : {};
}
function saveSchedules(obj) { writeJson(SCHEDULES_PATH, obj); }

function getScheduleByUser(userId) {
  const all = getSchedules();
  const list = all[String(userId)] || [];
  return Array.isArray(list) ? list.map(String) : [];
}
function addToSchedule(userId, courseId) {
  const uid = String(userId);
  const cid = String(courseId);
  const all = getSchedules();
  const set = new Set(all[uid] || []);
  set.add(cid);
  all[uid] = Array.from(set);
  saveSchedules(all);
  return all[uid];
}
function removeFromSchedule(userId, courseId) {
  const uid = String(userId);
  const cid = String(courseId);
  const all = getSchedules();
  const list = Array.isArray(all[uid]) ? all[uid].map(String) : [];
  all[uid] = list.filter(id => id !== cid);
  saveSchedules(all);
  return all[uid];
}

module.exports = {
  getUsers,
  getCourses,
  saveCourses,
  getScheduleByUser,
  addToSchedule,
  removeFromSchedule,
};