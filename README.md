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
RESEND_API_KEY="re_your_resend_api_key"
EMAIL_FROM="Hafi <no-reply@your-verified-domain.com>"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_rest_token"
```

Never commit `.env.local`, database URLs, passwords, or authentication secrets. The included `.gitignore` prevents this by default.

`RESEND_API_KEY` and `EMAIL_FROM` are required for staff email verification. Create the API key in Resend and use a sender address from a domain that you have verified there.

Cloudinary stores new place photos and banner media outside PostgreSQL when its three variables are present. Upstash enables shared rate limits across Vercel function instances when its two variables are present. Until you add them, the app keeps its existing media fallback and does not reject traffic because a limiter is unavailable.

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
| `npm run db:indexes` | Creates the safe, idempotent production indexes used by search, map, staff, and review queries. |

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

New media uploads use Cloudinary automatically when its environment variables are configured. Existing data URLs continue to work, so no current banner or service photo is lost. Cloudinary uploads return a public HTTPS URL which is stored in the existing media field instead of the Base64 file content.

## Performance and scale

- Public category, discovery, and service search responses use short CDN cache lifetimes.
- Nearby search first applies a small GPS bounding box in PostgreSQL, then calculates exact distance only for those candidates.
- `npm run db:indexes` creates idempotent PostgreSQL indexes for service search, map bounds, dashboard, staff, discovery, submission, and audit queries.
- Upstash rate limits authentication, public APIs, submissions, email-code requests, uploads, and administrator writes once its environment variables are configured.
- For high public map traffic, configure `NEXT_PUBLIC_MAP_TILE_URL` with a production tile provider that fits your chosen plan.

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
