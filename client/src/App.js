// client/src/App.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import "./App.css";
import { HashRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";

// Existing pages
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import About from "./pages/About";
import Contact from "./pages/Contact";

/** API base for dev vs GitHub Pages (prod) */
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://sdev-255-final-project-group6.onrender.com";

/* ---------------------------
   Auth Context (very simple)
---------------------------- */
const AuthContext = createContext(null);
export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // { id, username, role }
  const [token, setToken] = useState(null);   // JWT string
  const [loading, setLoading] = useState(true);

  // Load from localStorage on first render
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Login failed" }));
      throw new Error(error || "Login failed");
    }

    const data = await res.json(); // { token, user }
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);

  if (loading) return null; // simple guard while hydrating
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ---------------------------
   Small Login Page (inline)
---------------------------- */
function LoginPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await auth.login(form.username.trim(), form.password);
      nav("/"); // or nav("/courses")
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h2 className="mb-4">Sign in</h2>
      {error && <div className="alert alert-error mb-3">{error}</div>}
      <form onSubmit={onSubmit}>
        <label className="block mb-2">
          <span>Username</span>
          <input
            name="username"
            value={form.username}
            onChange={onChange}
            className="input"
            placeholder="teacher1 or student1"
            required
          />
        </label>
        <label className="block mb-3">
          <span>Password</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            className="input"
            placeholder="password"
            required
          />
        </label>
        <button className="btn" type="submit">Login</button>
      </form>
    </div>
  );
}

/* ---------------------------
   Navbar with Login/Logout
---------------------------- */
function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav className="nav">
      <div className="brand">SDEV 255 – Group 6</div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/courses">Courses</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        {user ? (
          <>
            <li className="muted">Signed in as: <strong>{user.username}</strong> ({user.role})</li>
            <li><button className="btn btn-link" onClick={logout}>Logout</button></li>
          </>
        ) : (
          <li><Link to="/login">Login</Link></li>
        )}
      </ul>
    </nav>
  );
}

/* ---------------------------
   App (HashRouter for GH Pages)
---------------------------- */
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}




