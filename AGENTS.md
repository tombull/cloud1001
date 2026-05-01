# Cloud1001 Architecture & Patterns

This application is built on top of the `astro-erudite` Astro template and uses a **Split-Stack Deployment Model** combined with **TinaCMS**.

## 1. Split-Stack Deployment
The architecture deploys the same source code into two entirely distinct configurations controlled by the `ENABLE_CMS` environment variable:
- **Static Site (`ENABLE_CMS` unset):** The public site is generated as a purely static, zero-JavaScript application. The `/admin` CMS and all API routes (`/api/tina/*`) are completely stripped from this build (API routes prerender to empty `[]`). Currently deployed to Cloudflare.
- **CMS Mode (`ENABLE_CMS=true`):** Built with `bun` atop `@astrojs/node` in standalone SSR mode. This enables server-side rendering for the TinaCMS backend, admin panel, and API routes. Used for local development and the Docker-hosted internal preview/editing environment.

## 2. Stateless Authentication Pipeline (Traefik + Authelia)
The CMS relies strictly on an identity-aware proxy map.
- The `CustomAuthProvider` (Frontend) does not manage tokens locally aside from pseudo-authorization states. 
- It instead relies on a custom proxy endpoint (`/api/auth-status`) which validates the presence of `remote-*` headers injected onto the reverse proxied traffic by Authelia. 
- **Critical Rule:** The `Remote-Groups` header must contain `cloud1001-admin`.

## 3. Ephemeral Database Strategy (Bun Native Redis)
The backend leverages an ephemeral Redis indexing cache.
- The standard LevelDown schema demanded by TinaCMS is wrapped using a custom native Bun driver `src/database/redis-level.ts`.
- Connections rely exactly on fast, pure `import { RedisClient } from "bun"` pipelines (utilizing `Promise.all` logic natively resolving concurrent commands).
- Because GitHub is the single Source of Truth (via TinaCMS Markdown API), the Redis cache holds zero permanent structural data and handles zero backups. 
