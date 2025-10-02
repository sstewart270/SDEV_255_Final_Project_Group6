// client/src/pages/Courses.js
import React, { useEffect, useState } from "react";

const API_BASE = window.location.hostname.endsWith(".github.io")
  // ⬇️ Replace with your exact Render URL (no trailing slash)
  ? "https://sdev-255-final-project-group6-2.onrender.com/"
  : ""; // In dev, the CRA proxy forwards /courses to localhost:5001

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", subject: "", credits: "" });
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const fetchCourses = async () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (subjectFilter) params.set("subject", subjectFilter);

    const res = await fetch(`${API_BASE}/courses${params.toString() ? `?${params}` : ""}`);
    const data = await res.json();
    setCourses(data);
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const resetForm = () => {
    setForm({ name: "", description: "", subject: "", credits: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      subject: form.subject.trim(),
      credits: Number(form.credits),
    };

    if (!payload.name || !payload.description || !payload.subject || isNaN(payload.credits)) {
      alert("Please fill in all fields correctly.");
      return;
    }

    if (editingId) {
      const res = await fetch(`${API_BASE}/courses/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { alert("Update failed"); return; }
    } else {
      const res = await fetch(`${API_BASE}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { alert("Create failed"); return; }
    }

    resetForm();
    fetchCourses();
  };

  const startEdit = (course) => {
    setEditingId(course.id);
    setForm({
      name: course.name,
      description: course.description,
      subject: course.subject,
      credits: String(course.credits),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    const res = await fetch(`${API_BASE}/courses/${id}`, { method: "DELETE" });
    if (!res.ok) { alert("Delete failed"); return; }
    fetchCourses();
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  return (
    <div className="container">
      <h1>Courses</h1>

      <form onSubmit={handleFilter} style={{ marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or description"
          style={{ marginRight: 8 }}
        />
        <input
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          placeholder="Filter by subject (e.g., CS)"
          style={{ marginRight: 8 }}
        />
        <button type="submit">Apply</button>
        <button type="button" onClick={() => { setQuery(""); setSubjectFilter(""); fetchCourses(); }} style={{ marginLeft: 8 }}>
          Clear
        </button>
      </form>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <h2>{editingId ? "Edit Course" : "Add Course"}</h2>
        <div style={{ display: "grid", gap: 8, maxWidth: 500 }}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={3} />
          <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject (e.g., CS)" />
          <input name="credits" value={form.credits} onChange={handleChange} placeholder="Credits (number)" />
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit">{editingId ? "Save Changes" : "Add Course"}</button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {courses.length === 0 ? (
        <p>No courses found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {courses.map((c) => (
            <li key={c.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{c.name}</strong>
                <div>
                  <button onClick={() => startEdit(c)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(c.id)}>Delete</button>
                </div>
              </div>
              <div style={{ marginTop: 6 }}>
                <em>Subject:</em> {c.subject} &nbsp; | &nbsp; <em>Credits:</em> {c.credits}
              </div>
              <p style={{ marginTop: 6 }}>{c.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

