// client/src/pages/Courses.js
import React, { useEffect, useState } from "react";

const emptyForm = { name: "", description: "", subject: "", credits: "" };

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null => create mode
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load from backend
  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/courses");
      if (!res.ok) throw new Error(`Failed to load courses (${res.status})`);
      const data = await res.json();
      setCourses(data);
    } catch (e) {
      setError(e.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    if (!form.name.trim()) return "Course name is required";
    if (!form.subject.trim()) return "Subject is required";
    if (!form.description.trim()) return "Description is required";
    const n = Number(form.credits);
    if (!Number.isFinite(n) || n < 0) return "Credits must be a non-negative number";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        description: form.description.trim(),
        credits: Number(form.credits),
      };

      let res;
      if (editingId == null) {
        // CREATE
        res = await fetch("/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // UPDATE
        res = await fetch(`/courses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      await refresh();
      setForm(emptyForm);
      setEditingId(null);
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      subject: c.subject,
      description: c.description,
      credits: String(c.credits),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this course?")) return;
    setError("");
    try {
      const res = await fetch(`/courses/${id}`, { method: "DELETE" });
      if (res.status !== 204) throw new Error(`Delete failed (${res.status})`);
      await refresh();
      if (editingId === id) cancelEdit();
    } catch (e) {
      setError(e.message || "Delete failed.");
    }
  }

  return (
    <section>
      <h1>Courses</h1>
      <p>Index of available courses and a form to add a new course.</p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: "1rem" }}>
        {error && (
          <div className="card" style={{ background: "#331", color: "#ffdede", marginBottom: 8 }}>
            {error}
          </div>
        )}
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
              type="number"
              min="0"
              step="1"
              value={form.credits}
              onChange={handleChange}
              placeholder="e.g., 3"
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

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : editingId == null ? "Add Course" : "Save Changes"}
          </button>
          {editingId != null && (
            <button type="button" className="secondary" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="list">
        {loading ? (
          <p>Loading…</p>
        ) : courses.length === 0 ? (
          <p>No courses yet.</p>
        ) : (
          courses.map((c) => (
            <article key={c.id} className="card">
              <header className="course-header" style={{ display: "flex", justifyContent: "space-between" }}>
                <h3>{c.name}</h3>
                <span className="badge">
                  {c.subject} • {c.credits} cr
                </span>
              </header>
              <p>{c.description}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => startEdit(c)}>Edit</button>
                <button className="danger" onClick={() => handleDelete(c.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

