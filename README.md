# IPFS Cluster Monitor Dashboard

SvelteKit dashboard for monitoring an IPFS Cluster. Communicates with the
cluster REST API and the tracker sidecar.

## Prerequisites

- Node.js 20+
- The IPFS Cluster Coordinator (separate repo) must be running on the same host
- The tracker sidecar (for `/summary` and `/failed-cids`) should be running

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLUSTER_API_URL` | `http://cluster:9094` | URL of the cluster REST API |
| `TRACKER_API_URL` | `http://tracker:9095` | URL of the tracker sidecar |
| `CACHE_TTL_MS` | `15000` | Cache TTL for cluster API responses |
| `MAX_CONCURRENT_CLUSTER_REQUESTS` | `5` | Concurrent request limit to cluster API |
| `CLUSTER_TIMEOUT_MS` | `30000` | Cluster API request timeout |
| `CLUSTER_MAX_RESPONSE_BYTES` | `5242880` | Max response body size (5 MB) |
| `PAGE_SIZE` | `50` | Default pagination page size for project CID lists |

## Deploy

**Production (current):** direct Node.js via systemd, no Docker — see below.
The `Dockerfile`/`docker-compose.yaml` in this repo still work for local
development.

### Deploy op VPS (production, systemd)

```bash
# Op je Mac: bouw lokaal
npm ci && npm run build

# Kopieer output naar de VPS
rsync -avz --delete build/ root@<vps>:/opt/sveltekit-monitor-app/build/

# Op de VPS: herstart de service
systemctl restart sveltekit-monitor
```

`.env` op de VPS bevat `HOST=127.0.0.1`, `PORT=3000`,
`CLUSTER_API_URL=http://127.0.0.1:9094`,
`TRACKER_API_URL=http://127.0.0.1:9095` (loopback).
De systemd-unit (`/etc/systemd/system/sveltekit-monitor.service`) zet
`MemoryMax=256M` en basis-hardening.
Caddy (host-level, `/etc/caddy/Caddyfile`) is de reverse proxy
en regelt HTTPS voor `glimmy.xyz`.

### Deploy via Docker (alternatief / lokale ontwikkeling)

```
docker compose up -d --build
```

## Architecture

```
Browser → Caddy (HTTPS, glimmy.xyz) → localhost:3000 (SvelteKit)
                                                      ├── cluster:9094 (per-CID via /pins/{cid}, allocaties via /allocations)
                                                      └── tracker:9095 (samenvatting via /summary, failed CIDs)
```

Alle communicatie met de cluster REST API gebeurt server-side
(SvelteKit `+page.server.ts`). De browser praat nooit direct met de cluster.

## Endpoints

| Method | Path | Data source | Schaalbaarheid |
|--------|------|-------------|----------------|
| `GET` | `/` | Tracker `/summary` (cached) + cluster `/allocations` | O(1) — geen live broadcast |
| `GET` | `/volunteer` | Cluster `/allocations` (alleen `pins.length`) | O(1) |
| `GET` | `/projects?project=&page=&per_page=` | Lokale CID-lijst + `getPinStatus` per pagina | O(peers × page_size) — per-CID lookup |
| `GET` | `/about` | Statisch | — |

Per-CID lookups (`getPinStatus`) gebruiken `GET /pins/{cid}` (zonder `local=true`),
wat **altijd de volledige `peer_map`** teruggeeft met echte multi-peer status.
De kosten schalen met het aantal peers (vast, klein), **niet** met het totale
aantal CIDs. Dit blijft dus goedkoop bij 200K+ CIDs.

## Paginering

De projectenpagina ondersteunt paginering via query parameters:

| Param | Default | Description |
|-------|---------|-------------|
| `project` | eerste project | Project ID (tab) |
| `page` | `1` | Paginanummer |
| `per_page` | `50` | CIDs per pagina |

## Development

```
npm install
npm run dev
```

Set `CLUSTER_API_URL=http://localhost:9094` in `.env` if the cluster
REST API is port-forwarded for local development.

## Tests

```
npm test
```