import React, { useState } from "react";

export default function Login({ doLogin, onSuccess }) {
  const [form, setForm] = useState({ username:"", password:"" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await doLogin(form.username.trim(), form.password);
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <>
      <section className="section">
        <div className="content-card" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h2 style={{ color: "#fff", marginTop: 0 }}>Sign In</h2>
          {error && <div className="alert alert-error mb-2">{error}</div>}
          <form onSubmit={submit} className="stack">
            <input
              className="input"
              placeholder="Username (e.g., teacher1)"
              value={form.username}
              onChange={(e)=>setForm({ ...form, username: e.target.value })}
            />
            <input
              className="input"
              type="password"
              placeholder="Password (e.g., password)"
              value={form.password}
              onChange={(e)=>setForm({ ...form, password: e.target.value })}
            />
            <button className="btn" type="submit">Login</button>
          </form>
        </div>
      </section>
    </>
  );
}