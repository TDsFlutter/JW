le# ëlla Jewelry — Full-Stack Web

This repo has **two** Next.js apps:

| App           | Folder         | Local URL               | Purpose                          |
| ------------- | -------------- | ----------------------- | -------------------------------- |
| Website       | `/` (root)     | http://localhost:3000   | Public storefront (customers)    |
| Admin Panel   | `/admin-panel` | http://localhost:3001   | Product/order management (admin) |

Both read/write the same **MongoDB Atlas** database.

---

## Local Setup (one-time)

### 1. Install dependencies

Run this **separately** in each app folder:

```bash
# Website (repo root)
npm install

# Admin panel
cd admin-panel
npm install
cd ..
```

### 2. Create environment files

Each app needs its own `.env.local`. Copy the example files and fill in your real values:

```bash
# Website
cp .env.example .env.local

# Admin panel
cp admin-panel/.env.example admin-panel/.env.local
```

> On Windows PowerShell use `Copy-Item .env.example .env.local` instead of `cp`.

At minimum set these in **both** `.env.local` files:

```
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/?appName=Cluster0
MONGODB_DB=ella_jewelry
```

> **MongoDB Atlas note:** in Atlas → **Network Access**, add `0.0.0.0/0` (allow from anywhere)
> so your local machine (and Vercel) can connect.

---

## Start the dev server (local testing)

Open **two terminals** — one for each app.

**Terminal 1 — Website:**

```bash
npm run dev
```
→ opens on http://localhost:3000

**Terminal 2 — Admin Panel:**

```bash
cd admin-panel
npm run dev
```
→ opens on http://localhost:3001

That's it. Both apps hot-reload as you edit files.

---

## Other commands

Run inside the relevant app folder (root for website, `admin-panel/` for admin):

| Command          | What it does                                              |
| ---------------- | -------------------------------------------------------- |
| `npm run dev`    | Start dev server with hot reload                          |
| `npm run build`  | Production build (same as Vercel runs)                    |
| `npm run start`  | Run the production build locally (run `build` first)      |
| `npm run lint`   | Lint the code                                             |

To verify a deploy will succeed before pushing, run `npm run build` in **both** folders.

---

## Deploy on Vercel

There are two Vercel projects (one per app):

- **Website** → Root Directory = `/` (repo root)
- **Admin Panel** → Root Directory = `admin-panel`

In each Vercel project → **Settings → Environment Variables**, add the same variables
you set in `.env.local` (`MONGODB_URI`, `MONGODB_DB`, Firebase keys, R2 keys for admin, etc.).

See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more.
