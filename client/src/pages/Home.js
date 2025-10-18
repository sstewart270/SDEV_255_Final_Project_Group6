import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      {/* Hero with background image/overlay (set in design.css via .page) */}
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">Find Your Courses</h1>
          <p className="hero__subtitle">The website is used for students and teachers to find courses.</p>
          <Link className="hero__cta" to="/courses">Find Here</Link>
        </div>
      </section>

      {/* Optional orange banner like the screenshots */}
      <section className="section">
        <div className="section--accent content-card">
          <strong>Contact Us</strong> &nbsp; • Ivy Tech Group 6 • (555) 555-5555 • Discord: https://discord.gg/eVEWn7G6
        </div>
      </section>
    </>
  );
}