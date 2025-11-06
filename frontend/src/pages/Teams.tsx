import "../styles/teams.css";

const TEAM_PROGRAMS = [
  {
    name: "Launch Pods",
    description: "Spin up a project room with standups, decision logs, and shared demo rehearsal space.",
    members: 12,
    status: "Recruiting",
  },
  {
    name: "Platform Guild",
    description: "Keep infra and tooling squads aligned with shared RFCs and rollout checklists.",
    members: 28,
    status: "Active",
  },
  {
    name: "Mentorship Crew",
    description: "Pair new engineers with senior ICs through structured pairing sprints.",
    members: 16,
    status: "Open seats",
  },
];

const TEAM_VALUES = [
  { label: "Shared rituals", copy: "Coordinated standups, async updates, and demo days." },
  { label: "Clear ownership", copy: "Role cards keep responsibilities obvious during every sprint." },
  { label: "Transparent health", copy: "Velocity, incidents, and blockers stay visible without spreadsheets." },
];

export default function Teams() {
  return (
    <div className="teams-page">
      <section className="teams-hero">
        <div>
          <p className="teams-eyebrow">Teams</p>
          <h1>Organize your crew, align your rituals.</h1>
          <p>
            From guild chats to mission-based pods, CodeTogether gives every team a dedicated workspace with the exact
            tools they need to stay in sync.
          </p>
        </div>
        <div className="teams-values">
          {TEAM_VALUES.map((value) => (
            <article key={value.label}>
              <h3>{value.label}</h3>
              <p>{value.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="teams-section">
        <div className="teams-section__header">
          <h2>Programs recruiting now</h2>
          <p>Select a pod, review the charter, and request an invite.</p>
        </div>
        <div className="teams-grid">
          {TEAM_PROGRAMS.map((program) => (
            <article key={program.name} className="teams-card">
              <header>
                <h3>{program.name}</h3>
                <span className={`teams-status teams-status--${program.status === "Active" ? "active" : "open"}`}>
                  {program.status}
                </span>
              </header>
              <p>{program.description}</p>
              <footer>
                <span>{program.members} members</span>
                <button type="button" className="teams-card__cta">
                  View brief
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="teams-section teams-section--cta">
        <div>
          <p className="teams-cta__eyebrow">Bring your org</p>
          <h2>Need a private workspace for your division?</h2>
          <p>Enterprise plans add SSO, audit logs, and custom regions for your security playbook.</p>
        </div>
        <button type="button" className="teams-cta__button">
          Talk to us
        </button>
      </section>
    </div>
  );
}
