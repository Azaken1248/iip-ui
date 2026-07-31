# IIP — Web UI

React + TypeScript + Tailwind front end for the Intern Integration Platform — one of the sibling repos that make up the platform (see [`docs`](https://github.com/Azaken1248/iip-docs) for architecture, use cases, data model, and the implementation plan).

Deliberately minimal per the architecture doc — this is not where engineering effort goes; it's a thin, validated form over the Source Service's REST API.

**Submit page (Phase 6.9, UC-1 / UC-2):** pick a contract, fill in a form built from that contract's own field definitions, and see its records in a table whose columns are the same definitions. No contract's field names appear anywhere in this page — a contract defined in the browser five minutes ago gets a usable form with no code written for it.

**Contracts page (Phase 6.7, UC-13):** define a contract — its fields, types, required-ness, queryable flags, record types and natural key — and register it with the Contract Registry. Registering takes effect immediately: no build, no deploy, no service restarted, and records can be submitted against the new contract seconds later. Client-side validation mirrors the registry's own `ContractDocumentValidator` so a caught mistake reads the same either way, but the registry remains the authority — a contract POSTed by curl or by the seed job never passes through this form.

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

Each backend's base URL is read from its own env var (see `.env.example`): `VITE_API_BASE_URL` for the Source Service, `VITE_DB_ADAPTER_BASE_URL` and `VITE_FILE_ADAPTER_BASE_URL` for the Targets page, and `VITE_CONTRACT_REGISTRY_URL` for the control plane.

The control plane is a **write** API, so the registry has to allow this app's origin explicitly — `CORS_ALLOWED_ORIGINS` in `infra`. A missing origin shows up as a browser CORS error that does not name what is missing, which is a long afternoon. Copy `.env.example` to `.env.local` for local development against services running outside Docker Compose.
