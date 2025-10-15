// client/src/App.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import "./App.css";
import { HashRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import Courses from "./pages/Courses";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Schedule from "./pages/Schedule"; // NEW

// ✅ Export so other files can import it
export const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://sdev-255-final-project-group6.onrender.com";

/* ---------------- Auth Context ---------------- */
const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      const t = localStorage.getItem("token");
      if (u && t) { setUser(JSON.parse(u)); setToken(t); }
    } catch {}
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(()=>({ error:"Login failed"}));
      throw new Error(error || "Login failed");
    }
    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    return data.user;
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem("user"); localStorage.removeItem("token");
  };

  const value = useMemo(()=>({ user, token, login, logout }), [user, token]);
  if (loading) return null;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ---------------- Small Login Page ---------------- */
function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username:"", password:"" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setError("");
    try {
      await login(form.username.trim(), form.password);
      nav("/courses");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h2 className="mb-3">Sign in</h2>
      {error && <div className="alert alert-error mb-2">{error}</div>}
      <form onSubmit={submit}>
        <input className="input mb-2" placeholder="Username" value={form.username}
               onChange={(e)=>setForm({...form, username:e.target.value})}/>
        <input className="input mb-3" type="password" placeholder="Password" value={form.password}
               onChange={(e)=>setForm({...form, password:e.target.value})}/>
        <button className="btn" type="submit">Login</button>
      </form>
    </div>
  );
}

/* ---------------- Navbar ---------------- */
function NavBar() {
  const { user, logout } = useAuth();
  return (
    <nav className="nav">
      <div className="brand">SDEV 255 – Group 6</div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/courses">Courses</Link></li>
        {user && <li><Link to="/schedule">My Schedule</Link></li>}
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        {user ? (
          <>
            <li className="muted">Signed in as <strong>{user.username}</strong> ({user.role})</li>
            <li><button className="btn btn-link" onClick={logout}>Logout</button></li>
          </>
        ) : (
          <li><Link to="/login">Login</Link></li>
        )}
      </ul>
    </nav>
  );
}

/* ---------------- App ---------------- */
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/courses" element={<Courses/>} />
            <Route path="/schedule" element={<Schedule/>} />
            <Route path="/about" element={<About/>} />
            <Route path="/contact" element={<Contact/>} />
            <Route path="/login" element={<LoginPage/>} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}




