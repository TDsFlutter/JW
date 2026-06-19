# ëlla Admin Panel

Standalone administration panel for the ëlla Jewelry website. This sub-project is designed to be deployed on a separate subdomain (e.g., `admin.ella-jewelry.com`) while sharing the same Firebase backend with the main storefront.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (runs on port 3001)
npm run dev

# Build for production
npm run build
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase credentials. These **must match** the same Firebase project used by the main website.

```bash
cp .env.example .env.local
```

### Key Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase project credentials (must match main site) |
| `R2_*` | Cloudflare R2 image upload configuration |
| `NEXT_PUBLIC_MAIN_SITE_URL` | URL of the main website for cross-navigation |

## Architecture

- **Shared Backend**: Both the main website and this admin panel connect to the same Firebase project (Firestore, Realtime DB, Auth, Storage).
- **Independent Frontend**: This is a completely standalone Next.js app — no shared components with the main storefront. No Header, Footer, or Cart.
- **Auth Guard**: Only users with `role: "admin"` in Firestore can access the dashboard. Non-admin users are redirected.

## Features

- 📊 Analytics Dashboard
- 📦 Product Catalog Management (CRUD)
- 📝 Blog Posts Manager
- ❓ FAQ Manager
- 📞 Contacts & Social Links
- 🛒 Order Tracker with status updates
- 🎨 Storefront Content & Banner Editor
- 👁️ Live Cart Monitor (Realtime DB)
- ⚡ Fast Listing Metadata Options
- 🌱 Firebase Database Seeding Portal

## Deployment

### Vercel (Recommended)

1. Import this directory as a new project on Vercel
2. Set the root directory to `admin-panel`
3. Add environment variables from `.env.example`
4. Set custom domain to `admin.your-domain.com`

### Static Export

```bash
npm run build
# Output will be in the `out/` directory
```

## Cross-Domain Navigation

- **Exit Admin** button navigates to `NEXT_PUBLIC_MAIN_SITE_URL/profile`
- Firebase Auth sessions are shared across subdomains (same `authDomain`)
