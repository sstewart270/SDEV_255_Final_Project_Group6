// client/src/pages/Login.js
import React, { useState } from "react";

// Use the same API base logic as Courses.js
const API_BASE =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://sdev-255-final-project_group6.onrender.com".replace("_", "-")); // just in case of copy typos

// Or simply:
// const API_BASE = window.location.hostname === "localhost"
//   ? "http://localhost:5001"
//   : "https://sdev-255-final-project-group6.onrender.com";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const msg = (await response.json().catch(() => null))?.error || "Invalid credentials";
        throw new Error(msg);
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onLogin) onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username (e.g., teacher1)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", marginBottom: "1rem" }}
          required
        />
        <input
          type="password"
          placeholder="Password (e.g., password)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: "1rem" }}
          required
        />
        <button type="submit">Log In</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Login;