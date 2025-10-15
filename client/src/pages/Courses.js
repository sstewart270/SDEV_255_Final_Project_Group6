// client/src/pages/Courses.js
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../App";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name:"", description:"", subject:"", credits:"" });
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);
  const token = localStorage.getItem("token") || "";

  const fetchCourses = async () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (subjectFilter) params.set("subject", subjectFilter);
    const res = await fetch(`${API_BASE}/courses${params.toString() ? `?${params}` : ""}`);
    const data = await res.json().catch(()=>[]);
    setCourses(Array.isArray(data) ? data : []);
  };
  useEffect(() => { fetchCourses(); /* eslint-disable-next-line */ }, []);

  /* -------- teacher CRUD -------- */
  const teacher = user?.role === "teacher";
  const handleChange = (e) => setForm((f)=>({ ...f, [e.target.name]: e.target.value }));
  const resetForm = () => { setForm({ name:"", description:"", subject:"", credits:"" }); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacher) return alert("Only teachers can add courses.");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      subject: form.subject.trim(),
      credits: Number(form.credits),
    };
    if (!payload.name || !payload.description || !payload.subject || isNaN(payload.credits)) {
      return alert("Please fill in all fields correctly.");
    }
    const res = await fetch(`${API_BASE}/courses${editingId ? `/${editingId}` : ""}`, {
      method: editingId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return alert("Save failed");
    resetForm(); fetchCourses();
  };

  const startEdit = (c) => {
    if (!teacher) return;
    setEditingId(c.id);
    setForm({ name:c.name, description:c.description, subject:c.subject, credits:String(c.credits) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!teacher) return;
    if (!window.confirm("Delete this course?")) return;
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: "DELETE",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });
    if (!res.ok) return alert("Delete failed");
    fetchCourses();
  };

  /* -------- student: add to schedule -------- */
  const addToSchedule = async (courseId) => {
    if (!token) return alert("Please log in first.");
    const res = await fetch(`${API_BASE}/schedule/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ courseId }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(()=> "");
      console.error("Add schedule failed:", res.status, txt);
      return alert("Could not add to schedule");
    }
    alert("Added to your schedule!");
  };

  const onFilter = (e) => { e.preventDefault(); fetchCourses(); };
  const onClear = () => { setQuery(""); setSubjectFilter(""); fetchCourses(); };

  return (
    <div className="container">
      <h1>Courses</h1>

      <form onSubmit={onFilter} style={{ marginBottom: 16 }}>
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search by name or description" style={{ marginRight: 8 }}/>
        <input value={subjectFilter} onChange={(e)=>setSubjectFilter(e.target.value)} placeholder="Filter by subject (e.g., CS)" style={{ marginRight: 8 }}/>
        <button type="submit">Apply</button>
        <button type="button" onClick={onClear} style={{ marginLeft: 8 }}>Clear</button>
      </form>

      {!teacher && (
        <p style={{ fontStyle: "italic", color: "#999", marginBottom: 16 }}>
          Click “Add to My Schedule” to build your schedule.
        </p>
      )}

      {teacher && (
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
            {editingId && <button type="button" onClick={resetForm} style={{ marginLeft: 8 }}>Cancel</button>}
          </div>
        </form>
      )}

      {courses.length === 0 ? (
        <p>No courses found.</p>
      ) : (
        <ul style={{ listStyle:"none", padding:0 }}>
          {courses.map((c) => (
            <li key={c.id} style={{ border:"1px solid #ddd", borderRadius:8, padding:12, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <strong>{c.name}</strong>
                <div>
                  {teacher ? (
                    <>
                      <button onClick={()=>startEdit(c)} style={{ marginRight:8 }}>Edit</button>
                      <button onClick={()=>handleDelete(c.id)}>Delete</button>
                    </>
                  ) : (
                    <button onClick={()=>addToSchedule(c.id)}>Add to My Schedule</button>
                  )}
                </div>
              </div>
              <div style={{ marginTop:6 }}>
                <em>Subject:</em> {c.subject} &nbsp; | &nbsp; <em>Credits:</em> {c.credits}
              </div>
              <p style={{ marginTop:6 }}>{c.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}