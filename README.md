# Roomy – Real-Time Chat Rooms

Roomy is a Supabase-powered chat experience where authenticated users can spin up rooms, invite others, and exchange messages in real time. The project is built with Vite, React, TypeScript, Tailwind CSS, and shadcn/ui components for a modern UX.

## Features

- 🔐 Email/password auth backed by Supabase
- 💬 Realtime room list and message stream using Supabase channels
- 📱 Responsive UI with shadcn/ui primitives and Tailwind CSS
- 🪄 Toast feedback, dialogs, and accessible components out of the box

## Tech Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- [Supabase JS SDK](https://supabase.com/docs/reference/javascript/initializing) for auth + database

## Prerequisites

- Node.js ≥ 18 (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm ≥ 9
- Supabase account + project (for local development)
- Supabase CLI (installed globally or via `npx supabase`)

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/Hayvi/roomy.git
cd roomy

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Update VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY with your project creds

# 4. Start the dev server
npm run dev
# Vite will default to http://localhost:8080 (auto-bumps if the port is busy)
```

## Supabase Setup

1. Log in via CLI (only needed once per machine):
   ```bash
   npx supabase login
   ```
2. Link the repo to your project:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
3. Apply migrations to create the required tables/functions:
   ```bash
   npx supabase db push
   ```
4. (Optional) Use the Supabase Table Editor to seed example rooms/users.

## Available Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start Vite in dev mode with HMR |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

## Deployment

- Build artifacts live in `dist/`. Deploy to any static host (Netlify, Vercel, Cloudflare Pages, etc.) that supports single-page apps.
- Ensure the production host exposes the same Supabase env variables (e.g., via dashboard settings or deployment secrets).

## Contributing

1. Fork & clone
2. Create a feature branch
3. Commit with conventional messages (`feat:`, `fix:`, etc.)
4. Push and open a PR

## License

This project is distributed under the MIT License. See [`LICENSE`](LICENSE) if/when one is added, or adapt to your preferred license.
