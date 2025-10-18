import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import "./App.css";
import "./design.css";
import { HashRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import Courses from "./pages/Courses";
import Schedule from "./pages/Schedule";
import Login from "./pages/Login";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

// Exported so pages can use it
export const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://sdev-255-final-project-group6.onrender.com";

/* ---------------- Auth Context ---------------- */
const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
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
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const value = useMemo(()=>({ user, token, login, logout }), [user, token]);
  if (loading) return null;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ---------------- Inline wrapper for Login page ---------------- */
function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  return <Login onSuccess={() => nav("/courses")} doLogin={login} />;
}

/* ---------------- App ---------------- */
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar />
        {/* page background + container */}
        <main className="page">
          <div className="container content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}




