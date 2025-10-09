// server/server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const store = require('./store'); // expects readJSON / writeJSON helpers

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// ------- middleware -------
app.use(cors());
app.use(express.json());

// ------- health -------
app.get('/', (_req, res) => {
  res.send('Backend is running!');
});

// ------- auth helpers -------
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

// ------- auth routes -------
// POST /auth/login  { username, password } -> { token, user }
app.post('/auth/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }

    const users = await store.readJSON('data/users.json'); // [{ id, username, role, passwordHash }]
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me -> current user (requires token)
app.get('/auth/me', authRequired, (req, res) => {
  const { id, username, role } = req.user;
  res.json({ id, username, role });
});

// ------- courses API (open for now so your UI keeps working) -------
app.get('/courses', async (_req, res, next) => {
  try {
    const courses = await store.readJSON('data/courses.json');
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

app.post('/courses', async (req, res, next) => {
  try {
    const { name, subject, credits, description } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    const courses = await store.readJSON('data/courses.json');
    const newCourse = {
      id: Date.now().toString(),
      name,
      subject: subject || '',
      credits: Number(credits) || 0,
      description: description || ''
    };
    courses.push(newCourse);
    await store.writeJSON('data/courses.json', courses);
    res.status(201).json(newCourse);
  } catch (err) {
    next(err);
  }
});

app.put('/courses/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, subject, credits, description } = req.body || {};

    const courses = await store.readJSON('data/courses.json');
    const idx = courses.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'not found' });

    courses[idx] = {
      ...courses[idx],
      ...(name !== undefined ? { name } : {}),
      ...(subject !== undefined ? { subject } : {}),
      ...(credits !== undefined ? { credits: Number(credits) } : {}),
      ...(description !== undefined ? { description } : {})
    };

    await store.writeJSON('data/courses.json', courses);
    res.json(courses[idx]);
  } catch (err) {
    next(err);
  }
});

app.delete('/courses/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const courses = await store.readJSON('data/courses.json');
    const idx = courses.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'not found' });

    const [removed] = courses.splice(idx, 1);
    await store.writeJSON('data/courses.json', courses);
    res.json(removed);
  } catch (err) {
    next(err);
  }
});

// ------- global error handler -------
app.use((err, _req, res, _next) => {
  console.error(err.stack || err);
  res.status(500).json({ error: 'Server error' });
});

// ------- start -------
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});