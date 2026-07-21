# IIP — Web UI

React + TypeScript + Tailwind front end for the Intern Integration Platform — one of the sibling repos that make up the platform (see [`docs`](https://github.com/Azaken1248/iip-docs) for architecture, use cases, data model, and the implementation plan).

Deliberately minimal per the architecture doc — this is not where engineering effort goes; it's a thin, validated form over the Source Service's REST API.

**Responsibilities (Release 1, UC-1 / UC-2):** submit a new intern record, view previously submitted records, show submission status returned by the Source Service.

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

The Source Service base URL is read from `VITE_API_BASE_URL` (see `.env.example`). Copy it to `.env.local` for local development against a Source Service running outside Docker Compose.
