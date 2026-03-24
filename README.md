# MenuNook

![MenuNook Banner](./public/og.png)

MenuNook is an open-source menu management app built to show how I approach product design, frontend craft, backend boundaries, and local-first developer setup.

It started as a small commercial product idea. It now lives as a runnable reference app: a real React + Express + tRPC + Supabase codebase that developers can inspect, run locally, and adapt.

## What It Does

- Create a business workspace
- Create one or more menus for that business
- Organize menus into categories and items
- Publish public menu pages for phone-friendly browsing
- Generate and share QR codes for each menu

## Why Open Source

I want this project to show:

- how I scope product decisions
- how I structure app state and server boundaries
- how I keep CRUD-heavy UI readable
- how I make local setup concrete instead of hand-wavy

## Stack

- Frontend: Vite, React 19, TypeScript, React Router 7, Tailwind CSS, shadcn/ui
- App data: tRPC with TanStack Query
- Backend: Express + tRPC
- Auth, database, storage: Supabase
- Testing: Vitest, Testing Library, MSW

## Local Setup

MenuNook is set up to run against a local Supabase stack from this repository.

Supabase local development docs:
https://supabase.com/docs/guides/local-development

### Prerequisites

- Node.js 20+
- Docker-compatible container runtime
- Supabase CLI

You can install the Supabase CLI either globally or from the repo. The current official local-dev flow is:

1. Install the Supabase CLI.
2. Initialize or use the repo's `supabase/` project.
3. Start the local stack with `supabase start`.

### First Run

1. Install app dependencies:

```bash
npm install
```

2. Start your container runtime:
   For example:

```
open -a docker
```

2. Start the local Supabase stack:

```bash
npm run supabase:start
```

3. Copy the env template:

```bash
cp .env.example .env
```

4. Get your local Supabase keys:

```bash
npm run supabase:status
```

5. Update `.env` with:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`
- `SUPABASE_SECRET_KEY`

6. Start the app:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.
The local Supabase Studio runs at `http://localhost:54323`.

## Local Auth With Google

This repo keeps Google OAuth as the sign-in path.

For local development, configure Google against the local Supabase Auth callback URL:

`http://127.0.0.1:54321/auth/v1/callback`

Recommended flow:

1. Create a Google OAuth application for local development.
2. Add the callback URL above in Google Cloud.
3. Start Supabase locally.
4. In local Supabase Studio, enable the Google provider and add your local client ID and client secret.

The app redirects back through `/auth/callback`, which is proxied to the local Express server during development.

## Database and Storage

This repo now includes a committed local Supabase project:

- [`supabase/config.toml`](/Users/andrewrowley/dev/menu-nook/app/supabase/config.toml)
- [`supabase/migrations/20260324150000_init_schema.sql`](/Users/andrewrowley/dev/menu-nook/app/supabase/migrations/20260324150000_init_schema.sql)

The initial migration creates:

- business, menu, category, and item tables
- sort-index tables for ordering categories and items
- QR code metadata storage
- user feedback storage
- row-level security policies for authenticated ownership
- a public `qr_codes` storage bucket

No seed data is included. A fresh local project starts empty.

## Development Notes

- Public menus are not paywalled.
- Preview mode exists to inspect a menu before sharing the public URL.
- The repo is optimized to be understandable as a working product codebase, not just a static demo.

## Scripts

- `npm run dev` starts frontend and backend together
- `npm run dev:frontend` starts Vite
- `npm run dev:backend` starts the Express server
- `npm run supabase:start` starts the local Supabase stack
- `npm run supabase:stop` stops the local Supabase stack
- `npm run supabase:status` prints local keys and service URLs
- `npm test -- --run` runs the test suite once

## Production Notes

The default path is local-first. Once you want to deploy this for real, replace the local Supabase values in `.env` with your hosted project values and regenerate types as needed.

## Contributing

This is intentionally lightweight for now. If you open an issue or PR, optimize for clarity, scoped changes, and concrete reasoning.
