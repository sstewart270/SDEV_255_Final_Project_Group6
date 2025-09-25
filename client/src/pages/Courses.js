import { useState } from "react";

const seedCourses = [
  {
    id: 1,
    name: "Intro to Web Development",
    description: "HTML, CSS, and basic JavaScript fundamentals.",
    subject: "CS",
    credits: 3,
  },
  {
    id: 2,
    name: "Data Structures",
    description: "Arrays, lists, stacks, queues, and trees.",
    subject: "CS",
    credits: 4,
  },
];

export default function Courses() {
  const [courses, setCourses] = useState(seedCourses);
  const [form, setForm] = useState({
    name: "",
    description: "",
    subject: "",
    credits: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleAddCourse(e) {
    e.preventDefault();
    if (!form.name || !form.description || !form.subject || !form.credits) return;
    const creditsNum = Number(form.credits);
    if (Number.isNaN(creditsNum) || creditsNum <= 0) return;

    const newCourse = {
      id: Date.now(),
      name: form.name.trim(),
      description: form.description.trim(),
      subject: form.subject.trim(),
      credits: creditsNum,
    };
    setCourses((c) => [newCourse, ...c]);
    setForm({ name: "", description: "", subject: "", credits: "" });
  }

  return (
    <section>
      <h1>Courses</h1>
      <p>Index of available courses and a form to add a new course.</p>

      {/* Add Course Form */}
      <form onSubmit={handleAddCourse} className="card" style={{ marginBottom: "1rem" }}>
        <div className="grid">
          <label>
            Course Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Algorithms"
              required
            />
          </label>

          <label>
            Subject Area
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="e.g., CS, MATH"
              required
            />
          </label>

          <label>
            Credits
            <input
              name="credits"
              value={form.credits}
              onChange={handleChange}
              placeholder="e.g., 3"
              inputMode="numeric"
              required
            />
          </label>
        </div>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Short summary of the course"
            rows={3}
            required
          />
        </label>

        <button type="submit">Add Course</button>
      </form>

      {/* Course List */}
      <div className="list">
        {courses.length === 0 ? (
          <p>No courses yet.</p>
        ) : (
          courses.map((c) => (
            <article key={c.id} className="card">
              <header className="course-header">
                <h3>{c.name}</h3>
                <span className="badge">
                  {c.subject} • {c.credits} cr
                </span>
              </header>
              <p>{c.description}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
