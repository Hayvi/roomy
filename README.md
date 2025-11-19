# Roomy 💬 – Anonymous Real-Time Chat Rooms

A modern, anonymous chat application built with Supabase, featuring Discord-style usernames, password-protected rooms, real-time messaging, and file sharing. No email required—just pick a name and start chatting!

## ✨ Features

- 🎭 **Anonymous Authentication** – No email or sign-up required
- 🏷️ **Discord-Style Names** – Unique display names with auto-generated tags (e.g., `Alex#1234`)
- 🔒 **Password-Protected Rooms** – Auto-generated 6-character passwords for each room
- 🌍 **Global Join** – Join any room with just a password
- 💬 **Real-Time Messaging** – Instant message delivery via Supabase Realtime
- 👥 **Online Status Tracking** – See who's active in rooms with live presence indicators
- 📎 **File Sharing** – Upload images and files (up to 5MB) with inline image previews
- 🗑️ **Auto-Cleanup** – Automatic data cleanup every 7 days (perfect for free tier)
- 🛡️ **Row-Level Security** – Protected database with PostgreSQL RLS policies
- 📱 **Responsive Design** – Modern UI built with shadcn/ui and Tailwind CSS
- ⚡ **Performance Optimized** – Database triggers, indexes, and computed columns


## 🛠️ Tech Stack

- **Frontend**: [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Database, Realtime, Storage)
- **Security**: PostgreSQL RLS + `pgcrypto` for password hashing

## 📋 Prerequisites

- Node.js ≥ 18 (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm ≥ 9
- Supabase account + project
- Supabase CLI (install globally or use via `npx supabase`)

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Hayvi/roomy.git
cd roomy
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Set Up Database

```bash
# Link to your Supabase project
npx supabase link --project-ref <your-project-ref>

# Apply all migrations
npx supabase db push
```

This will create:
- `public.profiles` – User display names
- `public.rooms` – Chat rooms with password hashes
- `public.room_secrets` – Plaintext passwords (visible to room owners)
- `public.room_members` – Room membership tracking with online status
- `public.messages` – Chat messages with file attachments
- `storage.buckets` – 'chat-attachments' bucket for file uploads
- Auto-cleanup cron job – Removes data older than 7 days
- RLS policies, triggers, indexes, and RPC functions


### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:8080` (or the port shown in your terminal)

## 📚 How It Works

### Anonymous Authentication
1. User picks a display name (e.g., "Alex")
2. App appends a random 4-digit tag → `Alex#1234`
3. Supabase creates an anonymous session
4. User profile is stored with the unique display name

### Creating a Room
1. User clicks "Create Room" and enters a name
2. App generates a random 6-character password (e.g., `x7k9p2`)
3. Password is hashed with `pgcrypto.crypt()` and stored
4. Plaintext password is saved separately for the owner to view/share
5. Creator automatically becomes the first member

### File Sharing
1. Users can upload files up to 5MB via the paperclip icon
2. Files are stored in the `chat-attachments` Supabase Storage bucket
3. Images are displayed inline with a lightbox view
4. Other files are shown as downloadable links

### Auto-Cleanup (7-Day Retention)
1. Scheduled cron job runs daily at 3:00 AM UTC
2. Automatically deletes rooms older than 7 days
3. Cascades to messages, room members, and storage files
4. Keeps your database within free tier limits
5. Can be manually triggered with `SELECT cleanup_old_data();`

### Security

- **Password Hashing**: All passwords are hashed using PostgreSQL's `pgcrypto`
- **RLS Policies**: Users can only view rooms they're members of
- **Storage Security**: Only authenticated users can upload/view files; users can only delete their own files
- **Membership Verification**: Messages require active room membership

## 📦 Available Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## 🗄️ Database Schema

### Tables
- **profiles** – User display names (unique)
- **rooms** – Room metadata (name, owner, member count, password hash)
- **room_secrets** – Plaintext passwords for owner display
- **room_members** – User-to-room memberships
- **messages** – Chat messages with timestamps and file URLs

### Storage
- **chat-attachments** – Public bucket for file uploads

### Key Functions
- `create_room(room_name, password)` – Creates room and adds creator as member
- `join_room(room_id, password_input)` – Verifies password and adds user as member

### Triggers
- Auto-update `member_count` when users join/leave rooms

## 🌐 Deployment

Build the frontend:
```bash
npm run build
```

Deploy `dist/` to any static host:
- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

**Important**: Ensure your host is configured with the Supabase environment variables.

## 🤝 Contributing

1. Fork & clone the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, etc.)
4. Push and open a Pull Request

## 📄 License

This project is distributed under the MIT License.

---

**Built with ❤️ using Supabase, React, and TypeScript**
