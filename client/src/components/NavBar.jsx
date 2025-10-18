import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../App";

export default function NavBar() {
  const { user, logout } = useAuth();
  const loc = useLocation();

  return (
    <header className="navbar">
      <div className="inner container">
        <Link to="/" className="brand">
          
          <span>SDEV 255 – Group 6</span>
        </Link>

        <nav className="nav">
          <Link to="/" className={loc.pathname==="/" ? "active" : undefined}>Home</Link>
          <Link to="/courses" className={loc.pathname==="/courses" ? "active" : undefined}>Courses</Link>
          {user && <Link to="/schedule" className={loc.pathname==="/schedule" ? "active" : undefined}>My Schedule</Link>}
        </nav>

        <div className="nav-rt">
          {user ? (
            <>
              <span className="user-pill">{user.username} ({user.role})</span>
              <button className="btn" onClick={logout}>Logout</button>
            </>
          ) : (
            <Link className="btn" to="/login">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}