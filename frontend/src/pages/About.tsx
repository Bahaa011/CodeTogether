import { Link } from "react-router-dom";
import "../styles/about.css";

const HERO_STATS = [
  { label: "Projects shipped", value: "4,800+" },
  { label: "Weekly commits", value: "73k" },
  { label: "Teams aligned", value: "1,200+" },
];

const MILESTONES = [
  {
    year: "2021",
    title: "Remote-first pairing",
    copy:
      "A small dev tools collective built a shared editor so distributed teams could finally pair program without lag.",
  },
  {
    year: "2022",
    title: "Secure cloud workspaces",
    copy:
      "We launched isolated sandboxes so product teams could explore ideas without worrying about leaking credentials.",
  },
  {
    year: "2024",
    title: "Realtime project graph",
    copy:
      "CodeTogether now visualizes every dependency and contributor in one place, keeping fast-growing teams aligned.",
  },
];

const VALUES = [
  {
    title: "Collaboration first",
    copy: "Pair review, live cursors, and shared context are baked into every workflow we launch.",
  },
  {
    title: "Security by design",
    copy: "From secrets scanning to role-based rooms, protecting your IP is table stakes, not an add-on.",
  },
  {
    title: "Shipping velocity",
    copy: "Telemetry dashboards keep you ahead of blockers so your team spends time building, not waiting.",
  },
];

export default function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero__content">
          <p className="about-hero__eyebrow">About CodeTogether</p>
          <h1 className="about-hero__title">
            Where distributed teams build software in the same room.
          </h1>
          <p className="about-hero__subtitle">
            CodeTogether helps fast-moving engineering orgs ideate, prototype, and ship as one crew.
            From real-time editors to guardrails for compliance, everything keeps your team focused on impact.
          </p>

          <div className="about-hero__actions">
            <Link className="about-hero__cta about-hero__cta--primary" to="/register">
              Start building
            </Link>
            <Link className="about-hero__cta about-hero__cta--ghost" to="/projects">
              Browse projects
            </Link>
          </div>
        </div>

        <div className="about-hero__metrics">
          {HERO_STATS.map((stat) => (
            <article key={stat.label} className="about-metric">
              <span className="about-metric__value">{stat.value}</span>
              <span className="about-metric__label">{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="about-mission">
        <article className="about-mission__panel">
          <h2>Our mission</h2>
          <p>
            We&apos;re turning code reviews, design spikes, and launch rehearsals into a shared ritual again.
            Whether your crew is across the city or across time zones, CodeTogether keeps context in one place so
            velocity never dips.
          </p>
        </article>

        <article className="about-mission__panel">
          <h3>What that means</h3>
          <ul className="about-mission__list">
            <li>
              <strong>One canvas.</strong> Specs, code, and QA runbooks stay linked to the same workspace.
            </li>
            <li>
              <strong>Signals, not noise.</strong> Health dashboards surface drift before incidents do.
            </li>
            <li>
              <strong>People first.</strong> Mentorship pods and async notes keep everyone in the loop.
            </li>
          </ul>
        </article>
      </section>

      <section className="about-grid">
        <article className="about-panel about-panel--timeline">
          <h2>Milestones</h2>
          <div className="about-timeline">
            {MILESTONES.map((milestone) => (
              <div key={milestone.year} className="about-timeline__item">
                <span className="about-timeline__year">{milestone.year}</span>
                <div>
                  <h3>{milestone.title}</h3>
                  <p>{milestone.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="about-panel about-panel--story">
          <h2>Built for modern engineering orgs</h2>
          <p>
            CodeTogether blends a secure IDE, backlog insights, and live collaboration tooling. No tab overload, no
            brittle handoffs—just one flow from idea to demo.
          </p>
          <div className="about-story__grid">
            <div>
              <h4>Realtime by default</h4>
              <p>Presence indicators, shared cursors, and synced terminals keep handoffs instant.</p>
            </div>
            <div>
              <h4>Insight rich</h4>
              <p>Project health, code coverage, and deployment readiness live beside the work, not buried in slides.</p>
            </div>
            <div>
              <h4>Enterprise ready</h4>
              <p>SOC 2 controls, audit logs, and custom roles scale from a 5-person crew to global orgs.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="about-values">
        <div className="about-values__header">
          <h2>Values we build with</h2>
          <p>Intentional rituals keep collaboration human even when your team isn&apos;t sitting together.</p>
        </div>

        <div className="about-values__cards">
          {VALUES.map((value) => (
            <article key={value.title} className="about-value">
              <h3>{value.title}</h3>
              <p>{value.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <div>
          <p className="about-cta__eyebrow">Launch something people love</p>
          <h2>Bring your team into the same creative flow.</h2>
          <p>
            Spin up a shared workspace, drop in a spec, and invite collaborators in seconds. CodeTogether makes every
            milestone visible so momentum never stalls.
          </p>
        </div>

        <div className="about-cta__actions">
          <Link className="about-cta__button about-cta__button--primary" to="/register">
            Create an account
          </Link>
          <Link className="about-cta__button about-cta__button--ghost" to="/login">
            Demo my workspace
          </Link>
        </div>
      </section>
    </div>
  );
}
