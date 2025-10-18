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

  const teacher = user?.role === "teacher";

  const fetchCourses = async () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (subjectFilter) params.set("subject", subjectFilter);
    const res = await fetch(`${API_BASE}/courses${params.toString() ? `?${params}` : ""}`);
    const data = await res.json().catch(()=>[]);
    setCourses(Array.isArray(data) ? data : []);
  };
  useEffect(()=>{ fetchCourses(); }, []); // eslint-disable-line

  /* -------- CRUD (teacher) -------- */
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const resetForm = () => { setForm({ name:"", description:"", subject:"", credits:"" }); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacher) return alert("Only teachers can add/edit courses.");
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
    window.scrollTo({ top: 0, behavior:"smooth" });
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
    if (!res.ok) return alert("Could not add to schedule");
    alert("Added to your schedule!");
  };

  const onFilter = (e) => { e.preventDefault(); fetchCourses(); };
  const onClear = () => { setQuery(""); setSubjectFilter(""); fetchCourses(); };

  return (
    <section className="section">
      <div className="stack">
        {/* Search/Filter */}
        <div className="content-card">
          <form onSubmit={onFilter} style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <input className="input" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search by name or description" />
            <input className="input" value={subjectFilter} onChange={(e)=>setSubjectFilter(e.target.value)} placeholder="Filter by subject (e.g., CS)" />
            <button className="btn" type="submit">Apply</button>
            <button className="btn" type="button" onClick={onClear}>Clear</button>
          </form>
        </div>

        {/* Teacher form */}
        {teacher && (
          <div className="content-card">
            <h2 style={{ color:"#fff", marginTop:0 }}>{editingId ? "Edit Course" : "Add Course"}</h2>
            <form onSubmit={handleSubmit} className="stack">
              <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="Name" />
              <textarea className="input" name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={3} />
              <input className="input" name="subject" value={form.subject} onChange={handleChange} placeholder="Subject (e.g., CS)" />
              <input className="input" name="credits" value={form.credits} onChange={handleChange} placeholder="Credits (number)" />
              <div style={{ display:"flex", gap:12 }}>
                <button className="btn" type="submit">{editingId ? "Save Changes" : "Add Course"}</button>
                {editingId && <button className="btn" type="button" onClick={resetForm}>Cancel</button>}
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="stack">
          {courses.length === 0 ? (
            <div className="content-card">No courses found.</div>
          ) : (
            courses.map((c) => (
              <div key={c.id} className="card">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <h3 className="card__title">{c.name}</h3>
                  <span className="card__badge">{c.subject} · {c.credits} cr</span>
                </div>
                <p className="card__meta" style={{ marginTop:6 }}>{c.description}</p>
                <div style={{ display:"flex", gap:10, marginTop:12 }}>
                  {teacher ? (
                    <>
                      <button className="btn" onClick={()=>startEdit(c)}>Edit</button>
                      <button className="btn" onClick={()=>handleDelete(c.id)}>Delete</button>
                    </>
                  ) : (
                    <button className="btn" onClick={()=>addToSchedule(c.id)}>Add to My Schedule</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}