/**
 * About Page
 * ------------
 * Introduces CodeTogether’s mission, values, and roadmap.
 *
 * Features:
 * - Hero section summarizing the platform’s vision
 * - Statistics panel highlighting growth and activity
 * - Core pillars representing product philosophy
 * - Roadmap preview showing upcoming quarterly features
 * - Culture section outlining team values and work ethic
 * - Final CTA inviting visitors to join or log in
 *
 * Components:
 * - Uses static constants (STATS, ROADMAP, PILLARS, CULTURE)
 *   for maintainable structured content.
 */

import { Link } from "react-router-dom";
import "../styles/about.css";

/**
 * STATS
 * ------
 * Snapshot of the platform’s growth indicators.
 * Each stat contains:
 * - label: description of the metric
 * - value: current state (string, not numeric for flexibility)
 */
const STATS = [
  { label: "Active projects", value: "Growing daily" },
  { label: "Community members", value: "Hundreds of users" },
  { label: "Collaborations completed", value: "Dozens of teams" },
];

/**
 * ROADMAP
 * ---------
 * Outlines CodeTogether’s quarterly development goals.
 * Each roadmap entry includes:
 * - quarter: time period label
 * - title: concise feature name
 * - summary: short description of planned improvement
 */
const ROADMAP = [
  {
    quarter: "Q1 2025",
    title: "Real-time collaboration upgrades",
    summary: "Faster syncing and version control improvements for smoother teamwork.",
  },
  {
    quarter: "Q2 2025",
    title: "Personalized workspaces",
    summary: "Custom dashboards, pinned projects, and notification settings tailored to each user.",
  },
  {
    quarter: "Q3 2025",
    title: "Community challenges",
    summary: "Coding sprints and hackathon-style events built right into the platform.",
  },
];

/**
 * PILLARS
 * --------
 * The three foundational values guiding product design.
 * Each object includes:
 * - title: value name
 * - copy: brief explanation of its meaning and application
 */
const PILLARS = [
  {
    title: "Collaboration first",
    copy: "CodeTogether is built around the idea that great software is made in teams — not in isolation.",
  },
  {
    title: "Practical innovation",
    copy: "Every feature focuses on making collaboration easier, not just adding complexity.",
  },
  {
    title: "Open and inclusive",
    copy: "We welcome learners, hobbyists, and professionals alike to create, share, and grow together.",
  },
];

/**
 * CULTURE
 * --------
 * Defines the internal values that shape how CodeTogether operates.
 * Each item includes:
 * - heading: principle title
 * - body: supporting explanation
 */
const CULTURE = [
  {
    heading: "We learn by building",
    body: "Every project is a chance to explore new ideas and improve how teams work together.",
  },
  {
    heading: "Security and reliability",
    body: "User data and code are handled responsibly with safety and transparency in mind.",
  },
  {
    heading: "Consistency matters",
    body: "We value steady progress over quick wins, building a platform that lasts.",
  },
];

/**
 * About Component
 * -----------------
 * Presents the mission, story, and cultural principles of CodeTogether.
 * Structured with reusable sections for readability and future scalability.
 */
export default function About() {
  return (
    <div className="about-page">
      <div className="about-container">
        {/* ------------------ Hero Section ------------------ */}
        <section className="about-hero">
          <div className="about-hero__copy">
            <p className="about-eyebrow">About CodeTogether</p>
            <h1>Where students and developers build together — anywhere.</h1>
            <p>
              CodeTogether is a collaborative coding platform made to connect people who love to create, learn, and
              ship software. Whether you’re starting a side project or working on a group assignment, you’ll find tools
              that make teamwork smoother and more rewarding.
            </p>
            <div className="about-hero__actions">
              <Link className="about-hero__button about-hero__button--primary" to="/register">
                Get started
              </Link>
              <Link className="about-hero__button about-hero__button--ghost" to="/projects">
                Explore projects
              </Link>
            </div>
          </div>

          {/* Stats cards (dynamic layout-ready) */}
          <div className="about-hero__stats">
            {STATS.map((stat) => (
              <article key={stat.label} className="about-stat">
                <span className="about-stat__value">{stat.value}</span>
                <span className="about-stat__label">{stat.label}</span>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------ Pillars Section ------------------ */}
        <section className="about-pillars">
          <header>
            <h2>Our core principles</h2>
            <p>
              We believe in open collaboration, meaningful learning, and practical tools that empower anyone to code and
              share without barriers.
            </p>
          </header>
          <div className="about-pillars__grid">
            {PILLARS.map((pillar) => (
              <article key={pillar.title} className="about-pillar">
                <h3>{pillar.title}</h3>
                <p>{pillar.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------ Story & Roadmap Section ------------------ */}
        <section className="about-story">
          <div className="about-story__panel">
            <h2>Our story</h2>
            <p>
              CodeTogether began as a student-led project aimed at making real-time coding easier and more accessible.
              What started as a small idea quickly grew into a community-driven platform for learning and collaboration.
            </p>
            <p>
              We’re still growing, improving, and listening to feedback from developers like you — one release at a time.
            </p>
          </div>

          <div className="about-roadmap">
            <header>
              <h3>What’s next</h3>
              <p>Here’s what we’re building to make CodeTogether even better.</p>
            </header>
            <div className="about-roadmap__list">
              {ROADMAP.map((item) => (
                <article key={item.quarter} className="about-roadmap__item">
                  <span className="about-roadmap__quarter">{item.quarter}</span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------ Culture Section ------------------ */}
        <section className="about-culture">
          <header className="about-culture__header">
            <h2>How we work</h2>
            <p>Our values keep us grounded as we build tools for collaboration and learning.</p>
          </header>
          <div className="about-culture__grid">
            {CULTURE.map((item) => (
              <article key={item.heading} className="about-culture__card">
                <h3>{item.heading}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------ CTA Section ------------------ */}
        <section className="about-cta">
          <div className="about-cta__copy">
            <p className="about-eyebrow">Join the community</p>
            <h2>Start building, learning, and sharing with others.</h2>
            <p>
              Create a workspace, start a project, and invite your teammates. CodeTogether makes collaboration simple,
              visual, and fun.
            </p>
          </div>
          <div className="about-cta__actions">
            <Link className="about-cta__button about-cta__button--primary" to="/register">
              Create an account
            </Link>
            <Link className="about-cta__button about-cta__button--ghost" to="/login">
              Log in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
