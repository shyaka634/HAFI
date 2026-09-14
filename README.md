# Hafi — Trusted services near you

**Hafi** is a Rwanda-focused service discovery platform that helps people find trusted local services, view their location on an interactive map, and get directions to the service they need.

It connects the public with verified community information while giving district agents, province managers, and super administrators a structured workflow for maintaining accurate service records.

## What Hafi offers

- Search for local services by name, category, or district.
- Browse service categories such as hospitals, pharmacies, schools, restaurants, garages, banks, shops, hotels, and more.
- View service locations, photos, and details on an interactive Leaflet and OpenStreetMap map.
- Use the device location to find nearby services and draw a route to a selected service.
- Submit and review service updates through a role-based approval workflow.
- Publish separate top and side-banner announcements, image adverts, and video banner adverts.
- Switch the public interface between English and Kinyarwanda.
- Install the platform as a Progressive Web App (PWA) for a faster, app-like experience.

> Map tiles, live location, directions, and new search results need an internet connection. Previously cached app pages and assets may remain available offline after the PWA has been installed and used.

## Built for a trusted local-data workflow

```text
District agent submits a service update
              ↓
Province manager reviews the update
              ↓
Super administrator oversees staff, activity, and public announcements
              ↓
Approved service information is available to the public
```

## Roles and access

| Role | Main responsibilities |
| --- | --- |
| **Public user** | Searches services, views maps, directions, photos, and announcements. |
| **District agent** | Adds or updates services for an assigned district. |
| **Province manager** | Reviews submissions from districts in an assigned province. |
| **Super administrator** | Manages staff, creates other super administrators, reviews all changes, manages announcements, and views activity history. |

The first account registered in a new database becomes the initial super administrator. Super administrators can then create staff accounts from **Manage team**. Deactivated agents and province managers are retained in the archived-staff area so their work history remains available.

## Technology

- **Framework:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS and reusable UI primitives
- **Database:** Neon PostgreSQL with Drizzle ORM
- **Authentication:** Better Auth
- **Maps:** Leaflet, React Leaflet, and OpenStreetMap
- **Directions:** OSRM routing service
- **Validation:** Zod
- **Offline support:** Web App Manifest and service worker

## Getting started

### Requirements

- Node.js 20 or later
- npm
- A Neon PostgreSQL database

### 1. Clone and install

```bash
git clone https://github.com/YOUR-GITHUB-USERNAME/hafi.git
cd hafi
npm install
```

### 2. Configure environment variables

Copy the public template and fill in your own values:

```bash
copy .env.example .env.local
```

On macOS or Linux, use:

```bash
cp .env.example .env.local
```

Your `.env.local` should contain:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
BETTER_AUTH_SECRET="generate-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

Never commit `.env.local`, database URLs, passwords, or authentication secrets. The included `.gitignore` prevents this by default.

### 3. Prepare the database

For a new Neon database, generate and apply the Drizzle migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Runs the app in development mode. |
| `npm run build` | Creates a production build. |
| `npm start` | Runs the production build. |
| `npm run lint` | Checks linting rules. |
| `npm run typecheck` | Checks TypeScript types without producing files. |
| `npm run verify` | Runs linting, type checks, and a production build. |
| `npm run clean` | Removes generated Next.js and TypeScript cache files. |
| `npm run db:generate` | Creates Drizzle migration files. |
| `npm run db:migrate` | Applies database migrations. |

Run the following before opening a pull request or deploying:

```bash
npm run verify
```

## Project structure

```text
src/
  app/                 Next.js pages and API routes
  components/          Shared layout and UI components
  features/            Feature-specific UI and logic
    services/          Search, maps, service cards, and directions
    submissions/       District-agent update workflow
    discoveries/       Public adverts and announcements
    admin/             Team, approval, audit, and admin workflows
  lib/
    auth/              Authentication configuration and helpers
    db/                Drizzle client and database schema
    permissions.ts     Role-based access rules
    validation.ts      Zod request validation
  providers/           Locale and other React providers
public/                PWA assets, icons, offline page, and images
```

## Media and announcements

Super administrators can publish top-banner and side-banner discoveries. A discovery can use a public image/video URL or a small file selected from the device.

- Images: PNG, JPEG, WebP, or GIF, up to 2 MB
- Videos: MP4, WebM, or Ogg, up to 8 MB

For production-scale media, use an object storage or media provider such as Cloudinary, Amazon S3, or Cloudflare R2 and save the resulting public URL. This keeps the database fast and avoids storing large media files as data URLs.

## Deployment notes

- Set `BETTER_AUTH_URL` to your deployed HTTPS domain.
- Add the production database URL and authentication secret through your hosting provider’s environment-variable settings.
- Run `npm run verify` before deploying.
- Use a managed PostgreSQL plan with backups, connection pooling, and monitoring as traffic grows.
- Apply rate limiting and caching to high-traffic public search endpoints before large-scale launch.

## Security and data handling

- Private environment files are excluded from Git by default.
- API requests are validated with Zod.
- Role-based access rules restrict staff and administrator actions.
- Staff should normally be deactivated rather than permanently deleted, preserving accountability and service history.
- Always use a Neon branch or backup before making direct database changes.

## Contact

**Hafi** — Location searching, advertisements, and marketing

- Phone / WhatsApp: [+250 788 684 086](https://wa.me/250788684086)

---

© 2026 Hafi. All rights reserved.
