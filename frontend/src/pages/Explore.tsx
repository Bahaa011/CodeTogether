import "../styles/explore.css";

const FEATURED_TAGS = ["AI", "DevOps", "Design Systems", "DX Tools", "Security", "Data Viz"];

const CURATED_PROJECTS = [
  {
    title: "Realtime Retro Board",
    description: "Collaborative retrospective board with templates and action item workflows.",
    contributors: 18,
    tag: "DX Tools",
  },
  {
    title: "Edge Render Engine",
    description: "Ultra-fast MDX renderer for docs, changelogs, and live previews.",
    contributors: 25,
    tag: "Developer Experience",
  },
  {
    title: "Atlas Design Kit",
    description: "Unified design tokens and component specs for cross-platform apps.",
    contributors: 42,
    tag: "Design Systems",
  },
];

const COMMUNITY_SPOTS = [
  { name: "Infra Owls", focus: "Platform & Reliability", members: 86 },
  { name: "Ship It Society", focus: "Feature Launch Pods", members: 54 },
  { name: "Mentor Mesh", focus: "Pairing & Onboarding", members: 112 },
];

export default function Explore() {
  return (
    <div className="explore-page">
      <section className="explore-hero">
        <div>
          <p className="explore-eyebrow">Explore</p>
          <h1>Find workspaces worth joining.</h1>
          <p>
            Filter open projects, discover active contributors, and drop into a team that matches your craft. CodeTogether
            keeps every spec, commit, and sprint ritual in one place.
          </p>
        </div>
        <div className="explore-hero__tags">
          {FEATURED_TAGS.map((tag) => (
            <button key={tag} type="button" className="explore-tag">
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className="explore-section">
        <div className="explore-section__header">
          <h2>Curated projects</h2>
          <p>Hand-picked repos that are currently onboarding new collaborators.</p>
        </div>
        <div className="explore-grid">
          {CURATED_PROJECTS.map((project) => (
            <article key={project.title} className="explore-card">
              <header>
                <span className="explore-badge">{project.tag}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </header>
              <footer>
                <span>{project.contributors} contributors</span>
                <button type="button" className="explore-card__cta">
                  Request access
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="explore-section">
        <div className="explore-section__header">
          <h2>Community hot spots</h2>
          <p>Jump into active crew chats and find a pod that ships the way you do.</p>
        </div>
        <div className="explore-list">
          {COMMUNITY_SPOTS.map((spot) => (
            <article key={spot.name} className="explore-spot">
              <div>
                <h3>{spot.name}</h3>
                <p>{spot.focus}</p>
              </div>
              <div className="explore-spot__meta">
                <span>{spot.members} members</span>
                <button type="button" className="explore-card__cta explore-card__cta--ghost">
                  Join space
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
