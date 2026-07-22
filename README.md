# IIP — Web UI

React + TypeScript + Tailwind front end for the Intern Integration Platform — one of the sibling repos that make up the platform (see [`docs`](https://github.com/Azaken1248/iip-docs) for architecture, use cases, data model, and the implementation plan).

Deliberately minimal per the architecture doc — this is not where engineering effort goes; it's a thin, validated form over the Source Service's REST API.

**Responsibilities (Release 1, UC-1 / UC-2):** submit a new intern record, view previously submitted records, show submission status returned by the Source Service.

**Targets page (Phase 1.21):** an operator view of the two Release 1 targets (Database, File) talking directly to `db-adapter`/`file-adapter`'s own admin APIs -- pause/resume each target's Kafka listener (not the container itself; see the adapters' `AdminController`) to demonstrate zero data loss, and view each target's actual data (a searchable table for Postgres, a spreadsheet-style grid for `interns.csv`).

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Configuration

Each backend's base URL is read from its own env var (see `.env.example`): `VITE_API_BASE_URL` for the Source Service, `VITE_DB_ADAPTER_BASE_URL` and `VITE_FILE_ADAPTER_BASE_URL` for the Targets page. Copy `.env.example` to `.env.local` for local development against services running outside Docker Compose.
