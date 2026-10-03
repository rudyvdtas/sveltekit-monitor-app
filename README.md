# IPFS Cluster Monitor Dashboard

SvelteKit dashboard for managing an IPFS Cluster. Communicates with the
cluster REST API over the shared `cluster-internal` Docker network.

## Prerequisites

- Docker
- The `cluster-internal` network must exist:
  ```
  docker network create cluster-internal
  ```
- The IPFS Cluster Coordinator (separate repo) must be running on the same host

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLUSTER_API_URL` | `http://cluster:9094` | URL of the cluster REST API |
| `DOMAIN` | `dashboard.localhost` | Domain for Traefik routing |

## Deploy

**Production (current):** direct Node.js via systemd, no Docker — see
`DEPLOY.md`-style notes below. The `Dockerfile`/`docker-compose.yaml` in this
repo still work for local development or an alternative host, but are not
what runs in production anymore (see `LESSONS.md` for why).

### Deploy op VPS (production, systemd)

```bash
# Op je Mac: bouw lokaal, geen build op de VPS
npm ci && npm run build

# Kopieer alleen de output + production deps-bron naar de VPS
scp -r build package.json package-lock.json projects-data root@<vps>:/opt/sveltekit-monitor-app/

# Op de VPS
cd /opt/sveltekit-monitor-app && npm ci --omit=dev
systemctl restart sveltekit-monitor
```

`.env` op de VPS bevat `HOST=127.0.0.1`, `PORT=3000`, `CLUSTER_API_URL=http://127.0.0.1:9094`,
`TRACKER_API_URL=http://127.0.0.1:9095` (loopback, geen Docker-netwerkalias —
het proces draait niet in een container). De systemd-unit
(`/etc/systemd/system/sveltekit-monitor.service`) zet `MemoryMax=256M` en
basis-hardening. Caddy (host-level, `/etc/caddy/Caddyfile`) is de reverse proxy
en regelt HTTPS voor `glimmy.xyz`.

### Deploy via Docker (alternatief / lokale ontwikkeling)

```
docker compose up -d --build
```

The dashboard is accessible via:
- Traefik at the configured `DOMAIN`
- Internally on port 3000 within the Docker network

## Architecture

```
Browser → Traefik → dashboard:3000 → cluster:9094 (REST API)
```

All communication with the cluster REST API happens server-side
(SvelteKit `+page.server.ts` / `+server.ts`). The browser never
talks directly to the cluster.

## API endpoints

The dashboard exposes these internal endpoints (used by the UI):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Overview: peers, pin counts, latest pins |
| `GET` | `/pins` | Pin management page |
| `POST` | `/api/pins/add` | Add a CID to the pinset |
| `POST` | `/api/pins/remove` | Remove a CID from the pinset |

These endpoints call the cluster REST API (`http://cluster:9094`) server-side.

## Development

```
npm install
npm run dev
```

Set `CLUSTER_API_URL=http://localhost:9094` in `.env` if the cluster
REST API is port-forwarded for local development.