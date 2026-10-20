# IPFS Cluster Monitor Dashboard

SvelteKit dashboard voor het IPFS Cluster: een statische uitleg-site plus een
projectpagina die curated CIDs toont met enriched metadata en per CID de live
pin-status (bv. `2/5` of `3/5` gepind).

## Prerequisites

- Node.js 20+
- De IPFS Cluster Coordinator (separate repo) moet op dezelfde host draaien
  en de cluster REST API beschikbaar stellen op `127.0.0.1:9094`

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLUSTER_API_URL` | `http://cluster:9094` | URL van de cluster REST API |
| `CACHE_TTL_MS` | `15000` | Cache TTL voor per-CID pin-status responses |
| `MAX_CONCURRENT_CLUSTER_REQUESTS` | `5` | Maximaal gelijktijdige requests naar de cluster API |
| `CLUSTER_TIMEOUT_MS` | `30000` | Cluster API request timeout |
| `CLUSTER_MAX_RESPONSE_BYTES` | `5242880` | Maximale response-grootte (5 MB) |
| `PAGE_SIZE` | `50` | Default paginagrootte voor project CID-lijsten |

## Deploy

**Production (current):** direct Node.js via systemd, no Docker — see below.
The `Dockerfile`/`docker-compose.yaml` in this repo still work for local
development.

### Deploy op VPS (production, systemd)

> **NB:** GitHub is only a backup. Never `git pull` from GitHub on the VPS; deploy via rsync of your local build.

```bash
# Op je Mac: bouw lokaal
npm ci && npm run build

# Kopieer output naar de VPS (publickey-authenticatie)
rsync -avz --delete build/ monitor@149.210.143.16:/opt/sveltekit-monitor-app/

# Voor password-based SSH-authenticatie, forceer fallback naar wachtwoordprompt:
rsync -avz --delete -e 'ssh -o PubkeyAuthentication=no' \
  build/ monitor@149.210.143.16:/opt/sveltekit-monitor-app/

# Als je als root deployt in plaats van monitor:
rsync -avz --delete build/ root@149.210.143.16:/opt/sveltekit-monitor-app/
ssh root@149.210.143.16 'systemctl restart sveltekit-monitor'
``` 

`.env` op de VPS bevat `HOST=127.0.0.1`, `PORT=3000` en
`CLUSTER_API_URL=http://127.0.0.1:9094` (loopback).
De systemd-unit (`/etc/systemd/system/sveltekit-monitor.service`) zet
`MemoryMax=256M` en basis-hardening.
Caddy (host-level, `/etc/caddy/Caddyfile`) is de reverse proxy
en regelt HTTPS voor `glimmy.xyz`.

### Deploy via Docker (alternatief voor productie of lokale ontwikkeling)

> Gebruik Docker Compose op de VPS in plaats van systemd of lokaal voor ontwikkeling.

```bash
# In /opt/sveltekit-monitor-app op de VPS (met .env in dezelfde map):
docker compose up -d --build

# Lokaal (om te testen):
docker compose up -d --build
```

## Architecture

```
Browser → Caddy (HTTPS, glimmy.xyz) → localhost:3000 (SvelteKit)
                                              └── cluster:9094 (per-CID via /pins/{cid})
```

De enige server-side call naar het cluster is de per-CID lookup
(`GET /pins/{cid}`) voor de pin-status-badge op de projectpagina. Alle overige
pagina's zijn statisch en raken het cluster niet.

## Endpoints

| Method | Path | Data source |
|--------|------|-------------|
| `GET` | `/` | Statisch |
| `GET` | `/projects?project=&page=&per_page=` | Lokale CID-lijst + `getPinStatus` per pagina |
| `GET` | `/volunteer` | Statisch |
| `GET` | `/about` | Statisch |

Per-CID lookups (`getPinStatus`) gebruiken `GET /pins/{cid}` (zonder `local=true`),
wat altijd de volledige `peer_map` teruggeeft met echte multi-peer status.
De kosten schalen met het aantal peers (vast, klein), niet met het totale
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
