# Cloud 1001 Markdown Blog & CMS

Welcome to **Cloud 1001**, my blog. This project is built with [Astro](https://astro.build/), [Tailwind](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/), and integrated with [TinaCMS](https://tina.io) for content management.

This repository is heavily extended from the fantastic [astro-erudite](https://github.com/jktrn/astro-erudite) template by [enscribe](https://github.com/jktrn), introducing a split-stack deployment architecture and a self-hosted TinaCMS backend.

---

## Architecture Overview

This project uses a **Split-Stack Deployment Model** to serve two entirely distinct environments from the same codebase. The behavior of the application is modified at build-time using the `DEPLOY_TARGET` environment variable.

1. **Cloudflare (Production)**: The public-facing site is generated as a purely static, zero-JavaScript application (`DEPLOY_TARGET=cloudflare`). The CMS admin interface and backend API routes are completely stripped out during the build process to minimize the attack surface and maximize client performance.
2. **Docker Node CMS (Internal Preview/Editing)**: An internal containerized deployment provides a Live Visual Editing environment for content editors (`DEPLOY_TARGET=docker`). Built using `bun` and `@astrojs/node` in standalone mode, it serves the TinaCMS backend API alongside the frontend preview.

### Authentication & Traefik/Authelia Pipeline

The standalone Docker CMS container does not manage its own user sessions or passwords. It bypasses TinaCMS's default database authentication and relies entirely on a reverse proxy pipeline:

- Traffic is routed via **Traefik**.
- Authentication is handled by **Authelia**.
- Authelia injects identity headers (`Remote-User`, `Remote-Email`, and `Remote-Groups`) into the reverse-proxied request.
- The Astro backend validates these headers via `/api/auth-status`. Users placed in the `cloud1001-admin` Authelia group are authorized to use the CMS backend APIs.

### Ephemeral Redis Database

The TinaCMS backend relies on a self-hosted Redis instance leveraging a custom Level DB wrapper. This database serves purely as a real-time caching and indexing layer:

- GitHub remains the **Single Source of Truth**.
- Redis requires zero backups and can be safely destroyed or rebuilt at any time without data loss since it re-syncs directly with the remote GitHub repository.

---

## Local Development & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/[YOUR_USERNAME]/[YOUR_REPO_NAME].git
   cd [YOUR_REPO_NAME]
   ```

2. **Setup environment variables:**
   Copy the example environment into place and fill in your details (especially `GITHUB_PERSONAL_ACCESS_TOKEN` for Tina to sync data).

   ```bash
   cp .env.example .env
   ```

3. **Install dependencies:**

   ```bash
   bun install
   ```

4. **Run the Dev Server (Local Node):**

   ```bash
   bun run dev
   ```

5. **Run the full Docker stack locally:**
   This spins up the production-style CMS node app accompanied by its Redis cache.

   ```bash
   docker compose up --build
   ```

---

## Adding Content

Content can be added visually via the running `/admin` panel (when browsing the Docker-hosted version), or manually via the filesystem.

### Blog Posts

Add new blog posts as `.mdx` files in the `src/content/blog/` directory.

| Field         | Type (Zod)      | Requirements                                              | Required |
| ------------- | --------------- | --------------------------------------------------------- | -------- |
| `title`       | `string`        | Should be ≤60 characters.                                 | Yes      |
| `description` | `string`        | Should be ≤155 characters.                                | Yes      |
| `date`        | `coerce.date()` | Must be in `YYYY-MM-DD` format.                           | Yes      |
| `order`       | `number`        | Sort order for subposts. Defaults to `0` if not provided. | Optional |
| `image`       | `image()`       | Should be exactly 1200px &times; 630px.                   | Optional |
| `tags`        | `string[]`      | Preferably use kebab-case for these.                      | Optional |
| `draft`       | `boolean`       | Defaults to `false` if not provided.                      | Optional |

### Projects

Add projects in `src/content/projects/` as Markdown files.

| Field         | Type            | Requirements                            | Required |
| ------------- | --------------- | --------------------------------------- | -------- |
| `name`        | `string`        | n/a                                     | Yes      |
| `description` | `string`        | n/a                                     | Yes      |
| `tags`        | `string[]`      | n/a                                     | Yes      |
| `image`       | `image()`       | Should be exactly 1200px &times; 630px. | Yes      |
| `link`        | `string.url()`  | Must be a valid URL.                    | Yes      |
| `startDate`   | `coerce.date()` | Must be in `YYYY-MM-DD` format.         | Optional |
| `endDate`     | `coerce.date()` | Must be in `YYYY-MM-DD` format.         | Optional |

---

## Configuration

- **Site Metadata**: Edit `src/consts.ts` to update site metadata (Title, description) and Navbar/Social links.
- **Color Palette**: Colors are defined in `src/styles/global.css` in [OKLCH format](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch), adopting the standard [shadcn/ui](https://ui.shadcn.com/) tokens.
- **Favicons**: Update the generated files in the `public/` directory (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, etc.) and adjust `src/components/Favicons.astro` as needed.

---

## License

This project is open source and available under the [MIT License](LICENSE).
