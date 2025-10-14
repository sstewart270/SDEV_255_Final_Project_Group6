// server/server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const store = require('./store'); // exposes readJSON / writeJSON

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// ---------- middleware ----------
app.use(cors());
app.use(express.json());

// ---------- health ----------
app.get('/', (_req, res) => {
  res.send('Backend is running!');
});

// ---------- auth helpers ----------
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET); // { id, username, role }
    next();
  } catch {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

// ---------- auth routes ----------
app.post('/auth/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }

    const users = await store.readJSON('data/users.json');
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    next(err);
  }
});

app.get('/auth/me', authRequired, (req, res) => {
  const { id, username, role } = req.user;
  res.json({ id, username, role });
});

// ---------- courses helpers ----------
async function getCourses() {
  return store.readJSON('data/courses.json');
}
async function saveCourses(courses) {
  return store.writeJSON('data/courses.json', courses);
}

// ---------- courses API ----------
// Read (public)
app.get('/courses', async (_req, res, next) => {
  try {
    const courses = await getCourses();
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

// Create (teacher-only) — stamps createdBy
app.post('/courses', authRequired, requireRole('teacher'), async (req, res, next) => {
  try {
    const { name, subject, credits, description } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    const courses = await getCourses();
    const newCourse = {
      id: Date.now().toString(),
      name,
      subject: subject || '',
      credits: Number(credits) || 0,
      description: description || '',
      createdBy: req.user.id,
    };
    courses.push(newCourse);
    await saveCourses(courses);
    res.status(201).json(newCourse);
  } catch (err) {
    next(err);
  }
});

// Update (teacher-only) — any teacher can edit
app.put('/courses/:id', authRequired, requireRole('teacher'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, subject, credits, description } = req.body || {};

    const courses = await getCourses();
    // Fix: compare as strings to handle legacy numeric ids
    const idx = courses.findIndex(c => String(c.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'not found' });

    const course = courses[idx];
    if (name !== undefined) course.name = name;
    if (subject !== undefined) course.subject = subject;
    if (credits !== undefined) course.credits = Number(credits) || 0;
    if (description !== undefined) course.description = description;
    if (!course.createdBy) course.createdBy = req.user.id;

    courses[idx] = course;
    await saveCourses(courses);
    res.json(course);
  } catch (err) {
    next(err);
  }
});

// Delete (teacher-only) — any teacher can delete
app.delete('/courses/:id', authRequired, requireRole('teacher'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const courses = await getCourses();
    // Fix: compare as strings to handle legacy numeric ids
    const idx = courses.findIndex(c => String(c.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'not found' });

    courses.splice(idx, 1);
    await saveCourses(courses);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---------- global error handler ----------
app.use((err, _req, res, _next) => {
  console.error(err.stack || err);
  res.status(500).json({ error: 'Server error' });
});

// ---------- start ----------
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});