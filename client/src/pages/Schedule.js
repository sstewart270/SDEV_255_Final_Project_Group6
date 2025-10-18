import React, { useEffect, useState } from "react";
import { API_BASE } from "../App";

export default function Schedule() {
  const [rows, setRows] = useState([]);
  const token = localStorage.getItem("token") || "";

  const load = async () => {
    if (!token) return setRows([]);
    const res = await fetch(`${API_BASE}/schedule`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(()=>[]);
    setRows(Array.isArray(data) ? data : []);
  };

  const removeItem = async (courseId) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/schedule/remove/${courseId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return alert("Could not remove");
    load();
  };

  useEffect(()=>{ load(); }, []); // eslint-disable-line

  if (!token) {
    return (
      <section className="section">
        <div className="content-card">Please log in as a student to view your schedule.</div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="content-card">
        <h2 style={{ color:"#fff", marginTop:0 }}>My Schedule</h2>
        {rows.length === 0 ? (
          <p className="card__meta">No courses in your schedule yet.</p>
        ) : (
          <ul style={{ listStyle:"none", padding:0, margin:0 }}>
            {rows.map((c) => (
              <li key={c.id} className="card" style={{ marginTop:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div className="card__title">{c.name}</div>
                    <div className="card__meta" style={{ marginTop:4 }}>
                      Subject: {c.subject} · Credits: {c.credits}
                    </div>
                  </div>
                  <button className="btn" onClick={()=>removeItem(c.id)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}