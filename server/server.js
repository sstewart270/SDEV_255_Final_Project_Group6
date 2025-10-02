// server/server.js
const express = require('express');
const cors = require('cors');
const { loadCourses, saveCourses } = require('./store');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Load from disk at startup
let courses = loadCourses();

// Health check
app.get('/', (_req, res) => {
  res.send('Backend is running!');
});

// List all courses (optional search/filter via ?q= & ?subject=)
app.get('/courses', (req, res) => {
  const { q = '', subject } = req.query;
  let result = courses;

  if (q) {
    const needle = q.toLowerCase();
    result = result.filter(
      c =>
        c.name.toLowerCase().includes(needle) ||
        c.description.toLowerCase().includes(needle)
    );
  }
  if (subject) {
    result = result.filter(c => c.subject.toLowerCase() === subject.toLowerCase());
  }

  res.json(result);
});

// Get one course
app.get('/courses/:id', (req, res) => {
  const id = Number(req.params.id);
  const course = courses.find(c => c.id === id);
  if (!course) return res.status(404).json({ error: 'not found' });
  res.json(course);
});

// Create
app.post('/courses', (req, res) => {
  const { name, description, subject, credits } = req.body;
  if (!name || !description || !subject || credits == null) {
    return res
      .status(400)
      .json({ error: 'name, description, subject, credits are required' });
  }

  const nextId = courses.length ? Math.max(...courses.map(c => c.id)) + 1 : 1;
  const course = {
    id: nextId,
    name,
    description,
    subject,
    credits: Number(credits)
  };

  courses.push(course);
  saveCourses(courses); // persist
  res.status(201).json(course);
});

// Update
app.put('/courses/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = courses.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });

  const updates = { ...req.body };
  if (updates.credits != null) updates.credits = Number(updates.credits);

  courses[idx] = { ...courses[idx], ...updates, id };
  saveCourses(courses); // persist
  res.json(courses[idx]);
});

// Delete
app.delete('/courses/:id', (req, res) => {
  const id = Number(req.params.id);
  const before = courses.length;
  courses = courses.filter(c => c.id !== id);
  if (courses.length === before) return res.status(404).json({ error: 'not found' });

  saveCourses(courses); // persist
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

