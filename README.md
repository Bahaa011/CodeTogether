## CodeTogether – Collaborative IDE Platform

CodeTogether is a full‑stack TypeScript application that lets teams spin up lightweight “projects” with a shared Monaco editor, real‑time operational transform (OT) syncing, versioned backups, an invite system, and an integrated terminal/runner. The project is structured as:

- **Frontend** – Vite + React 19 + TypeScript, Socket.IO client, Monaco editor, custom workspace UI and modals.
- **Backend** – NestJS 11 + TypeORM + PostgreSQL, Socket.IO gateway for OT, JWT auth with optional MFA, mailing, project/file/version services, and Terminal + Editor websockets.

> This README documents the full local setup so the repository is publishable on GitHub. Update credentials before making it public.

---

### ✨ Major Features
- **Real-time collaborative editing** backed by Monaco + OT via Socket.IO (`EditorGateway`) with conflict-free merges.
- **Project workspace** with file explorer, tabs, keyboard shortcuts, unsaved indicators, and backup/restore history.
- **Versioning & backups** – capture labeled snapshots per file and restore directly from the UI (`VersionModule`).
- **Execution & terminal streaming** – run files from the editor and stream stdout/stderr (`TerminalGateway` + `useTerminal`).
- **Permissions & invites** – owners can invite collaborators, enforce read-only access, and manage project tags.
- **Authentication & MFA** – email login, optional 2FA, password reset and verification flows.
- **Searchable explore/playground pages** – public project discovery and quick language playground with runnable samples.
- **Responsive UI** with dark theme, navbar, sidebar, and multiple modal workflows (project settings, profiles, backups, etc.).

---

## Project Structure

```
CodeTogether/
├── backend/                 # NestJS application (REST + WebSocket gateways)
│   ├── src/
│   │   ├── auth/            # Auth controller/service, JWT strategy, MFA handling
│   │   ├── project/         # Project CRUD, tags, collaborators, DTOs
│   │   ├── file/            # File CRUD + text OT helpers
│   │   ├── version/         # Backup + restore logic
│   │   ├── editor.gateway.ts# Socket.IO OT gateway
│   │   ├── terminal/        # TerminalGateway (remote execution stream)
│   │   └── ...              # user, notification, comment modules, etc.
│   └── package.json
├── frontend/                # Vite React SPA
│   ├── src/
│   │   ├── components/      # Monaco editor, sidebar, modals, navbar, etc.
│   │   ├── hooks/           # Project workspace, realtime collaboration, terminal, forms
│   │   ├── pages/           # Home, Explore, ProjectView, Playground, Auth flows
│   │   ├── services/        # API clients (Axios) for auth, projects, files, versions
│   │   └── styles/          # CSS modules for workspace + landing pages
│   └── package.json
└── README.md
```

---

## Requirements

- Node.js 20+
- npm (or pnpm/yarn) – commands in this README use **npm**
- PostgreSQL 14+ instance
- (Optional) Gmail/SMTP credentials for email flows

---

## Backend Setup (NestJS)

```bash
cd backend
npm install
```

Copy the sample env file and adjust values:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` (ignored by git) to override credentials used in `AppModule` and `AuthModule`. Suggested values:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASS=postgres
DATABASE_NAME=codetogether
TYPEORM_SYNCHRONIZE=true

JWT_SECRET=replace-me
JWT_EXPIRES_IN=1d

MAIL_USER=hello@example.com
MAIL_PASS=app-password-or-smtp-secret
FRONTEND_URL=http://localhost:5173
SESSION_STALE_MS=60000
```

Update `src/app.module.ts` to read from these env vars (currently hardcoded for dev). Also move the inline JWT secret in `auth.module.ts` to the env file before committing to GitHub.

`SESSION_STALE_MS` controls how long (in ms) a presence session is considered online without receiving socket heartbeats.

Run the API + websockets in watch mode:

```bash
npm run start:dev
```

This will expose:
- REST API at `http://localhost:3000`
- Swagger docs at `http://localhost:3000/docs`
- Socket.IO namespaces for editor (`editor:*`) and terminal (`terminal:*`)

### Useful backend scripts

| Script | Purpose |
|--------|---------|
| `npm run start` | Compile + run once |
| `npm run start:dev` | Watch mode (recommended for development) |
| `npm run build` | Emit compiled JS to `dist/` |
| `npm run lint` | ESLint with auto-fix |
| `npm run test`, `test:watch`, `test:cov` | Jest unit tests |
| `npm run test:e2e` | E2E tests (Supertest) |

TypeORM currently runs with `synchronize: true` which auto-migrates schema; keep for dev only and replace with migrations in production.

---

## Frontend Setup (React + Vite)

```bash
cd frontend
npm install
```

Copy the example file and tweak URLs:

```bash
cp frontend/.env.example frontend/.env
```

Then edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_COLLAB_WS_URL=http://localhost:3000
VITE_TERMINAL_WS_URL=http://localhost:3000
```

Then run the dev server:

```bash
npm run dev
```

The SPA is served at `http://localhost:5173` and proxies API/WebSocket calls to the backend URLs defined above.

### Useful frontend scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + build production bundle |
| `npm run preview` | Serve production build locally |
| `npm run lint` | ESLint (React, hooks, refresh) |

---

## Key Application Flows

1. **Authentication & MFA**
   - Users register/login via `AuthController`.
   - Optional MFA sends crypto-based OTP codes via Nodemailer/Gmail.
   - Password reset generates expiring tokens linked to `FRONTEND_URL`.

2. **Project workspace**
   - `useProjectWorkspace` orchestrates fetching metadata, file lists, read-only states, invites, backups, and editor actions.
   - `useProjectEditor` maintains file tabs, draft content, dirty flags, saves, and synchronization with backend `FileService`.

3. **Real-time collaboration**
   - `EditorGateway` + `useRealtimeCollaboration` run an OT stack (`text-ot` utils) that transforms operations before broadcasting.
   - The Monaco editor stays uncontrolled; remote edits are applied via `executeEdits` while guarding against cursor jumps.

4. **Version history & backups**
   - `VersionModule` persists labeled snapshots.
   - UI exposes `BackupHistoryModal`, `ProjectSettingsModal` for revert/restore actions.

5. **Terminal / Run button**
   - `TerminalGateway` streams run output to the frontend.
   - `useTerminal` hook subscribes to Socket.IO events and renders them in the terminal pane.

6. **Explore & Playground**
   - Public pages hitting `projectService` to list/filter tagged projects.
   - Standalone playground uses Monaco + sample code for instant running without touching team projects.

---

## Testing & Quality

- **Backend** – Jest unit & e2e tests (`npm run test`, `npm run test:e2e`), ESLint + Prettier configs.
- **Frontend** – TypeScript strict mode, ESLint rule sets (React, hooks, refresh). Add vitest/react-testing-library as needed.
- **Operational transforms** – `text-ot.ts` contains normalization, apply, transform, and diff utilities used by both client and server.

---

## Deployment Notes

- Swap hardcoded secrets (`JWT secret`, `DB credentials`, `MAIL_*`) for environment variables before pushing public code.
- Turn off `synchronize: true` in production and run proper TypeORM migrations.
- Serve the frontend’s production build (`npm run build && npm run preview`) behind a static host or CDN.
- When deploying behind HTTPS, update VITE URLs and backend CORS configuration accordingly.

---

## Roadmap / Ideas

- Persist OT document snapshots in Redis to scale beyond a single server.
- Add granular roles (viewer/commenter/editor).
- Integrate containerized sandboxes for code execution instead of a shared terminal.
- Add vitest/RTL coverage for the frontend workspace components.
- Introduce project templates and Git import/export flows.

---

## Contributing

1. Fork & clone this repository.
2. Create a feature branch: `git checkout -b feature/some-feature`.
3. Follow lint/test guidelines for both frontend and backend.
4. Submit a PR describing the change, screenshots for UI tweaks, and steps to test.

---

## License

No explicit license is defined yet. Add one (MIT, Apache-2.0, etc.) before making the repository public.

---

Happy hacking! Let me know if you need additional deployment docs or diagrams. 🚀
