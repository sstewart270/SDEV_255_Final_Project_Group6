import React, { useEffect, useState } from "react";
import { API_BASE } from "../App";

export default function Schedule() {
  const [items, setItems] = useState([]);
  const token = localStorage.getItem("token") || "";

  const load = async () => {
    if (!token) return setItems([]);
    try {
      const res = await fetch(`${API_BASE}/schedule`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load schedule");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const handleRemove = async (courseId) => {
    if (!window.confirm("Remove this course from your schedule?")) return;
    try {
      const res = await fetch(`${API_BASE}/schedule/remove/${courseId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Remove failed");
      
      
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to remove course. Please try again.");
    }
  };

  if (!token) {
    return <p style={{ marginTop: 24 }}>Please log in to view your schedule.</p>;
  }

  return (
    <div>
      <h1>My Schedule</h1>
      {items.length === 0 ? (
        <p>No courses in your schedule yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {items.map((c) => (
            <li
              key={c.id}
              style={{
                border: "1px solid #2d3748",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: 18 }}>{c.name}</strong>
                  <div style={{ marginTop: 6, opacity: 0.9 }}>
                    <em>Subject:</em> {c.subject} &nbsp; | &nbsp;{" "}
                    <em>Credits:</em> {c.credits}
                  </div>
                </div>
                <button onClick={() => handleRemove(c.id)}>Remove</button>
              </div>
              <p style={{ marginTop: 8 }}>{c.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}