// server/server.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const {
  getUsers,
  getCourses,
  saveCourses,
  getScheduleByUser,
  addToSchedule,
  removeFromSchedule,
} = require("./store");

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

app.use(
  cors({
    origin: ["http://localhost:3000", "https://sstewart270.github.io"],
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(express.json());

/* ----------------- Auth helpers ----------------- */
function sign(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}
function authRequired(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
function teacherOnly(req, res, next) {
  if (req.user?.role !== "teacher") return res.status(403).json({ error: "Teacher only" });
  next();
}

/* ----------------- Health ----------------- */
app.get("/", (_req, res) => res.send("Backend is running!"));

/* ----------------- Auth ----------------- */
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    const user = getUsers().find((u) => u.username === username);
    if (!user) return res.status(401).json({ error: "invalid credentials" });

    const stored = user.passwordHash || user.password || "";
    const ok = stored.startsWith("$2") ? await bcrypt.compare(password, stored) : password === stored;
    if (!ok) return res.status(401).json({ error: "invalid credentials" });

    const token = sign(user);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/auth/me", authRequired, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
});

/* ----------------- Courses ----------------- */
app.get("/courses", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const subject = (req.query.subject || "").toLowerCase();
  let list = getCourses();
  if (q) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  }
  if (subject) list = list.filter((c) => c.subject.toLowerCase().includes(subject));
  res.json(list);
});

app.post("/courses", authRequired, teacherOnly, (req, res) => {
  const { name, description, subject, credits } = req.body || {};
  if (!name || !description || !subject || isNaN(Number(credits))) {
    return res.status(400).json({ error: "Invalid course payload" });
  }
  const courses = getCourses();
  const id = "c" + (Date.now().toString(36) + Math.random().toString(36).slice(2));
  const course = { id, name, description, subject, credits: Number(credits), createdBy: req.user.id };
  courses.push(course);
  saveCourses(courses);
  res.status(201).json(course);
});

app.put("/courses/:id", authRequired, teacherOnly, (req, res) => {
  const courses = getCourses();
  const idx = courses.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  if (courses[idx].createdBy && courses[idx].createdBy !== req.user.id) {
    return res.status(403).json({ error: "You can only modify your own courses" });
  }

  const { name, description, subject, credits } = req.body || {};
  if (!name || !description || !subject || isNaN(Number(credits))) {
    return res.status(400).json({ error: "Invalid course payload" });
  }

  courses[idx] = { ...courses[idx], name, description, subject, credits: Number(credits) };
  saveCourses(courses);
  res.json(courses[idx]);
});

app.delete("/courses/:id", authRequired, teacherOnly, (req, res) => {
  const courses = getCourses();
  const idx = courses.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  if (courses[idx].createdBy && courses[idx].createdBy !== req.user.id) {
    return res.status(403).json({ error: "You can only delete your own courses" });
  }
  const [deleted] = courses.splice(idx, 1);
  saveCourses(courses);
  res.json({ ok: true, deletedId: deleted.id });
});

/* ----------------- Schedule (cart) ----------------- */
// GET my schedule (expanded)
app.get("/schedule", authRequired, (req, res) => {
  const mine = getScheduleByUser(req.user.id);           // ["c1","c2",...]
  const all = getCourses();
  const expanded = mine
    .map((cid) => all.find((c) => String(c.id) === String(cid)))
    .filter(Boolean);
  res.json(expanded);
});

// POST add to my schedule
app.post("/schedule/add", authRequired, (req, res) => {
  const { courseId } = req.body || {};
  if (!courseId) return res.status(400).json({ error: "courseId required" });

  const exists = getCourses().some((c) => String(c.id) === String(courseId));
  if (!exists) return res.status(404).json({ error: "Course not found" });

  const list = addToSchedule(req.user.id, courseId);
  res.json({ ok: true, courseIds: list });
});

// DELETE remove from my schedule
app.delete("/schedule/remove/:courseId", authRequired, (req, res) => {
  const { courseId } = req.params;
  const list = removeFromSchedule(req.user.id, courseId);
  res.json({ ok: true, courseIds: list });
});

/* ----------------- Start ----------------- */
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});