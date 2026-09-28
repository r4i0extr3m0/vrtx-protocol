# VRTX Protocol

> **Production-oriented mobile B2B2C platform for personal trainers and their clients.**

VRTX Protocol is a React Native + Expo fitness platform evolving into **VRTX Coach**:
coaches prescribe workouts and nutrition, while clients execute plans and return
adherence, measurements, and progress in the same app.

The project was developed with an AI coding agent as part of the engineering workflow,
with human ownership of product requirements, architecture, security decisions, review,
validation, and merge decisions. The repository includes automated tests, CI, Supabase
authentication and RLS, a FastAPI AI service, Stripe billing foundations, and an
offline-first mobile experience.

## Current Focus: VRTX Coach

- Role-aware mobile experience for `coach` and `client` users.
- Invite-based coach/client linking with tenant isolation through Supabase RLS.
- Workout prescription, scheduled training, adherence check-ins, measurements, and
  meal-by-meal nutrition plans.
- AI coaching service in `ai-api/`, with bearer-token validation and rate limiting for
  protected usage.
- Stripe Billing foundations for Basic, Plus, and Premier coach plans.

The current product focus and implementation status are maintained in
[`docs/ROADMAP_B2B.md`](docs/ROADMAP_B2B.md). This is a production-oriented project
foundation, not a claim that every operational launch requirement is complete.

## Visual Demo

The following captures show the real mobile application during development:

| App flow | Preview |
| --- | --- |
| App shell and current UI | ![VRTX app preview](vrtx-current.png) |
| Login and authenticated experience | ![VRTX login preview](vrtx-login-final.png) |
| Bundled mobile build | ![VRTX bundled preview](vrtx-bundled.png) |

The recommended 30-60 second walkthrough is documented in
[`docs/DEMO.md`](docs/DEMO.md): login, coach area, client link, prescription,
adherence, and AI Coach. The screenshots are local development artifacts and must be
added to the Git commit if they are intended to render for repository visitors.

## Architecture at a Glance

```text
React Native + Expo Router
          |
          +--> Supabase Auth, Postgres, RLS, RPCs, Edge Functions
          |
          +--> Stripe Billing for coach subscriptions
          |
          +--> FastAPI AI service for protected coaching features
          |
          +--> Optional Node/tRPC/Drizzle server layer
```

Useful technical references:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - current system boundaries and data flow.
- [`docs/INTEROPERABILITY.md`](docs/INTEROPERABILITY.md) - integration contracts.
- [`docs/AI_DEVELOPMENT.md`](docs/AI_DEVELOPMENT.md) - AI-assisted engineering process.
- [`docs/RUNBOOK.md`](docs/RUNBOOK.md) - local setup, migrations, and operations.
- [`docs/COMMERCIAL_LAUNCH.md`](docs/COMMERCIAL_LAUNCH.md) - commercial launch checklist.
- [`ai-api/README.md`](ai-api/README.md) - FastAPI service and environment.
- [`docs/ROADMAP_B2B.md`](docs/ROADMAP_B2B.md) - canonical product roadmap.

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm dev:metro
```

Useful checks:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

The app reads `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env`. Never put service-role, Stripe secret,
or webhook secrets in the mobile environment.

## Repository Status

- Mobile app: active React Native + Expo Router codebase.
- Supabase: migrations, RLS, B2B RPCs, billing tables, and account deletion function.
- Stripe: checkout/webhook Edge Functions and coach billing screen are implemented;
  production secrets, webhook configuration, and end-to-end payment validation remain
deployment responsibilities.
- `server/`: optional tRPC/Drizzle layer, not required for the current mobile B2B flow.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for development checks and
[`docs/README.md`](docs/README.md) for the documentation index.
