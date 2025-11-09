import { Link, Navigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import "../styles/home-landing.css";

const highlights = [
  {
    title: "Start coding instantly",
    body: "No downloads, no setup. Open a live playground for JavaScript, Python, C++, or Java right from your browser.",
  },
  {
    title: "Collaborate in real time",
    body: "Invite teammates or friends to code together. Every keystroke updates instantly — just like being side by side.",
  },
  {
    title: "Grow your projects",
    body: "Turn quick ideas into full repositories with history, contributors, and version tracking when you're ready.",
  },
];

export default function Home() {
  if (getToken()) {
    return <Navigate to="/explore" replace />;
  }

  return (
    <div className="landing-home">
      {/* 👇 Hero Section */}
      <section className="landing-hero">
        <div>
          <p className="landing-eyebrow">Welcome to CodeTogether</p>
          <h1>The easiest way to code, collaborate, and create — together.</h1>
          <p>
            CodeTogether lets you experiment, build, and share ideas in real time. 
            Whether you're learning a new language, working on a group project, or prototyping your next big idea — 
            everything happens in one seamless workspace.
          </p>

          <div className="landing-cta-row">
            <Link to="/playground" className="landing-cta landing-cta--primary">
              Try Playground
            </Link>
            <Link to="/login" className="landing-cta landing-cta--secondary">
              Sign in
            </Link>
          </div>
        </div>

        {/* 👇 Hero Card */}
        <div className="landing-hero-card">
          <p>What you can do here</p>
          <ul>
            <li>Run code instantly — no setup required</li>
            <li>Collaborate with others in real time</li>
            <li>Save and organize projects when you log in</li>
          </ul>
        </div>
      </section>

      {/* 👇 Highlights Section */}
      <section className="landing-grid">
        {highlights.map((item) => (
          <article key={item.title} className="landing-card">
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      {/* 👇 Call-to-Action Section */}
      <section className="landing-cta-section">
        <h2>Start coding with your team in seconds.</h2>
        <p>
          Skip the setup and jump straight into what matters — creating, learning, and building amazing projects 
          together from anywhere.
        </p>
        <div className="landing-cta-row">
          <Link to="/register" className="landing-cta landing-cta--primary">
            Create a free account
          </Link>
          <Link to="/explore" className="landing-cta landing-cta--secondary">
            Explore public projects
          </Link>
        </div>
      </section>
    </div>
  );
}
