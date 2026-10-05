# Security review lessons

## Bevindingen

Deze lijst is gebaseerd op een statische review van de huidige `main`-branch. Het is geen volledige penetratietest.

- **Hoog — ontbrekende authenticatie en autorisatie:** het dashboard wordt via Traefik gepubliceerd zonder zichtbare authenticatie, autorisatie, IP-beperking of TLS-configuratie.
- **Hoog — gevoelige clusterinformatie kan uitlekken:** zonder toegangscontrole kunnen peer IDs, IPFS IDs, netwerkadressen, versies, peer-namen, pin-statussen en CIDs zichtbaar worden.
- **Hoog — cluster-REST-API moet intern blijven:** controleer dat `CLUSTER_API_URL` en poort `9094` niet rechtstreeks vanaf het internet bereikbaar zijn.
- **Middel/hoog — interne foutdetails worden aan gebruikers getoond:** `String(e)` en response bodies van de cluster-API worden rechtstreeks in de response gezet.
- **Middel — requests hebben geen timeout:** `fetch()` naar de cluster-API gebruikt geen `AbortController`; een trage of vastgelopen backend kan serverresources bezet houden.
- **Middel — responses zijn niet begrensd:** `/pins` wordt volledig ingelezen en verwerkt. Een zeer grote response kan onnodig veel geheugen en CPU gebruiken.
- **Middel — ontbrekende security headers:** er is geen zichtbare CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` of `Permissions-Policy`.
- **Middel/laag — container hardening ontbreekt:** de productie-image stelt geen expliciete non-root user in en kopieert de volledige `node_modules` uit de builder-stage.
- **Nog te verifiëren — dependencies:** voer `npm audit`, `npm outdated` en een container/image-scan uit; uit een statische bronreview kan niet worden vastgesteld of alle dependencyversies vrij zijn van bekende CVE's.

## Aanpak en stappen

### 1. Toegang tot het dashboard beperken

- Kies een toegangsmodel: SSO/basic auth via Traefik, VPN, private network of een IP-allowlist.
- Voeg HTTPS/TLS toe en voorkom een productie-deployment met `dashboard.localhost` als standaardhostnaam.
- Controleer dat het dashboard niet publiek bereikbaar is voordat authenticatie is toegevoegd.
- Voeg tests toe die anonieme requests afwijzen.

### 2. De cluster-API afschermen

- Bind de cluster-API alleen aan het interne Docker-netwerk.
- Controleer firewall- en reverse-proxyregels voor poort `9094`.
- Gebruik authenticatie of een service credential als de cluster-API dit ondersteunt.
- Zorg dat secrets uitsluitend via runtime environment/secrets management worden aangeleverd en nooit in Git staan.

### 3. Foutafhandeling veilig maken

- Log details server-side met een request-ID.
- Stuur naar de browser alleen een generieke foutmelding.
- Geef geen upstream response body, interne URL, stack trace of configuratiewaarde terug.
- Test expliciet fouten van de cluster-API met gevoelige inhoud in de response body.

### 4. Requests robuust maken

- Voeg een timeout toe met `AbortController`.
- Beperk responsegrootte en het maximaal aantal pins dat wordt verwerkt.
- Gebruik waar passend pagination of een server-side limiet.
- Voeg rate limiting en caching toe als het dashboard publiek of breed toegankelijk is.
- Test timeouts, malformed JSON, onverwacht grote responses en upstream 5xx-responses.

### 5. Security headers toevoegen

- Configureer minimaal CSP, HSTS bij HTTPS, `X-Content-Type-Options: nosniff`, `Referrer-Policy` en `Permissions-Policy`.
- Beperk framing met `frame-ancestors` in CSP of `X-Frame-Options`.
- Controleer de headers met OWASP ZAP, Mozilla Observatory of een vergelijkbare scanner.

### 6. Container en dependencies hardenen

- Laat de runtime-container expliciet als non-root user draaien.
- Installeer alleen production dependencies in de runtime-stage.
- Pin of verifieer base images en scan images met Trivy of Docker Scout.
- Voer in CI `npm ci`, `npm audit --audit-level=high`, tests en de container-scan uit.
- Activeer Dependabot of Renovate voor gecontroleerde updates.

### 7. Validatie voor release

- Voer een dependency-scan uit.
- Voer een secret-scan uit op de volledige Git-history, niet alleen op de huidige bestanden.
- Test anonieme toegang, foutmeldingen, timeouts, grote responses en security headers.
- Controleer Docker-, Traefik-, firewall- en cloud security-groepen samen; veilige applicatiecode compenseert geen publiek blootgestelde backend-poorten.
- Herhaal de review na iedere wijziging aan authenticatie, proxying, clustercommunicatie of deployment.

## Leerpunten

- **Server-side code is niet automatisch privé:** data die door een `load`-functie wordt geretourneerd, kan onderdeel worden van de browserresponse.
- **Een interne default-URL is geen netwerkbeveiliging:** `http://cluster:9094` voorkomt alleen een verkeerde hostnaam; Docker-netwerken en firewallregels moeten toegang daadwerkelijk beperken.
- **Foutmeldingen zijn een gegevensuitvoer:** upstream response bodies kunnen net zo gevoelig zijn als succesvolle data.
- **Beschikbaarheid hoort bij security:** timeouts, rate limits, response-limieten en pagination verkleinen het DoS-risico.
- **Defence-in-depth is noodzakelijk:** authenticatie, netwerkisolatie, headers, veilige logging, container hardening en dependencybeheer vullen elkaar aan.
- **Een statische review heeft grenzen:** dependency-CVE's, runtimeconfiguratie, Docker-netwerken en echte toegangscontrole moeten ook dynamisch worden getest.

## Definition of done

- [ ] Dashboard vereist authenticatie of is aantoonbaar alleen intern bereikbaar.
- [ ] Cluster-API en poort `9094` zijn niet publiek bereikbaar.
- [ ] Productie gebruikt HTTPS en passende security headers.
- [ ] Foutmeldingen bevatten geen interne details.
- [ ] Alle upstream requests hebben timeouts en response-limieten.
- [ ] Runtime-container draait als non-root.
- [ ] Dependency-, secret- en container-scans draaien in CI.
- [ ] Securitytests voor de bovenstaande scenario's zijn toegevoegd.

---

# Performance fixes (september 2026)

## Wat is er gewijzigd

### Server-side cache met single-flight (src/lib/server/cache.ts)

Er is een generieke TTL-cache toegevoegd die:
- Factory results cached binnen de TTL.
- Gelijktijdige cache-misses deelt één in-flight Promise (single-flight), zodat meerdere page loads niet allemaal `/pins` oproepen.
- Foutresponses **niet** cached — een volgende call probeert opnieuw.
- `invalidate()` laat de cache per key leegmaken (o.a. na `addPin`/`removePin`).

### Cluster API client (src/lib/server/cluster.ts)

- `getId()`, `getPeers()`, `getPins()` lopen nu door de cache.
- Concurrency limit via semafoor — configureerbaar via env var.
- `getPins()` valideert na het ophalen of het aantal pins en peer allocations binnen de ingestelde limieten valt; overschrijding geeft een gecontroleerde fout.
- Malformed JSON / ongeldige response wordt gedetecteerd en geeft een fout, in plaats van stil `[]` te retourneren.
- Observability: logging van requestduur, responsegrootte, pin/allocatie-aantallen, actieve requests, rejected requests.
- Cache-invalidatie bij `addPin` en `removePin`.

### Tests (src/lib/server/cache.test.ts, src/lib/server/cluster.test.ts)

25 tests die dekken: cache hit/miss, single-flight, error caching, TTL-verloop, oversized responses, timeout, HTTP errors, malformed JSON, max pins, max peer allocations, cache-invalidatie na mutaties.

## Nieuwe environment variables

| Variable | Default | Beschrijving |
|---|---|---|
| `CACHE_TTL_MS` | `15000` | Cache TTL in ms voor cluster API responses |
| `MAX_PINS` | `10000` | Maximaal aantal pins dat verwerkt wordt |
| `MAX_PEER_ALLOCATIONS` | `100000` | Maximaal aantal peer allocation entries |
| `MAX_CONCURRENT_CLUSTER_REQUESTS` | `5` | Maximaal aantal gelijktijdige requests naar cluster |
| `CLUSTER_TIMEOUT_MS` | `10000` | Request timeout in ms |
| `CLUSTER_MAX_RESPONSE_BYTES` | `5242880` | Maximale responsegrootte in bytes |

## VPS monitoring

Controleer OOM-kills en resource usage:

```bash
docker stats
journalctl -k --since "24 hours ago" | grep -Ei "oom|out of memory|killed process"
dmesg -T | grep -Ei "oom|out of memory|killed process"
```

## Validatie

```bash
npm ci
npm run check
npm test
npm run build
```

# Failed CIDs tracker (oktober 2026)

## Wat is er gewijzigd

### Tracker client (`src/lib/server/failed-cids.ts`)

Er is een nieuwe client-module toegevoegd die `GET /failed-cids` oproept bij de tracker-service (`http://tracker:9095`). De tracker zelf is een los Python-script (`track-failed-cids.py`) dat de cluster `/pins` API bewaakt en CIDs met herhaalde errors na 5 opeenvolgende tellingen automatisch unpint via `DELETE /pins/{cid}`.

Deze module:
- Haalt periodiek de lijst met gefaalde CIDs op van de tracker.
- Faalt stil (`[]` terug) bij netwerkfouten of HTTP errors, zodat het dashboard niet breekt als de tracker offline is.
- Gebruikt `AbortSignal.timeout(5000)` voor een korte timeout.

### Dashboard (`src/routes/+page.server.ts`, `src/routes/+page.svelte`)

- De `load`-functie roept `getFailedCids()` aan en koppelt projectnamen aan de CIDs via de bestaande `cidToProject`-map.
- Op het dashboard is een nieuwe Failed CIDs-kaart toegevoegd, alleen zichtbaar als er gefaalde CIDs zijn. Deze staat naast de bestaande Activity/Redundancy-secties.

### Environment

| Variable | Default | Beschrijving |
|---|---|---|
| `TRACKER_API_URL` | `http://tracker:9095` | URL van de failed-CID tracker API |

# Migratie weg van Coolify (oktober 2026) — in uitvoering

## Aanleiding

VPS heeft maar 1.8GB RAM. `docker stats` liet zien dat Coolify's eigen beheerstack
(sentinel + coolify + db + redis + realtime + proxy) ~424MB gebruikte — bijna evenveel
als de hele cluster-workload (`cluster` + `ipfs` samen ~422MB), met `coolify` zelf
pieken tot 90% CPU. Gecombineerd met het ontbreken van memory-limits op alle containers
en een ongecontroleerde rebalance van 3336 nieuwe CIDs is dit een belangrijke oorzaak
van de VPS-crashes. Volledig stappenplan: zie `TODO.md` in de workspace-root.

## Branch

`architecture-moving-away-from-coolify`

## Fase 1 (lokaal voorbereid)

`Caddyfile` toegevoegd aan de repo-root als vervanging voor Coolify's Traefik-proxy
(`coolify-proxy`). Reverse-proxyt naar `localhost:3000` met dezelfde security headers
die nu al via `hooks.server.ts` worden gezet. Domeinnaam is nog een placeholder
(`<jouw-domein>`) — moet vóór gebruik vervangen worden met het echte DNS-record.

Installatie van Caddy zelf (`apt install caddy`), het plaatsen van dit bestand op
`/etc/caddy/Caddyfile`, en syntax-validatie (`caddy validate`) moeten op de VPS zelf
gebeuren — dat kan niet vanuit de lokale werkomgeving.

**Status: Fase 1 t/m 4 volledig afgerond (3 okt 2026).** Caddy draait live op
`glimmy.xyz` + `www.glimmy.xyz`, `coolify-proxy` is gestopt (niet verwijderd).

## Fase 3 — monitor draait nu via systemd, niet via Docker

**Beslissing:** `package.json` heeft maar 1 runtime-dependency
(`@sveltejs/adapter-node`), geen native/platform-specifieke packages. Dat maakt
Docker voor dit proces overbodige overhead: bouw lokaal (`npm run build` op de
Mac), scp alleen de output, en draai `node build/index.js` rechtstreeks via
systemd. Voordelen: geen `npm ci` + `vite build`-piek op de VPS tijdens elke
deploy (dat was een apart geïdentificeerd risico), en een harde `MemoryMax` via
systemd — iets wat met de Docker-aanpak tot nu toe nergens was ingesteld.

**Uitgevoerd:**
- Node.js 20.20.2 op de VPS (NodeSource apt-repo, zelfde versie als de oude
  Docker-image).
- Non-root systemuser `monitor`, draait in `/opt/sveltekit-monitor-app`.
- `.env`: `HOST=127.0.0.1` (nooit `0.0.0.0` — zonder Docker-netwerkisolatie zou dat
  de app rechtstreeks publiek blootstellen buiten Caddy om), `CLUSTER_API_URL` en
  `TRACKER_API_URL` gewijzigd naar `http://127.0.0.1:<poort>` in plaats van de
  Docker-netwerkaliassen `cluster`/`tracker` (die resolven niet vanaf de host).
- Hiervoor was een aanvullende wijziging in `ipfs-cluster-coordinator` nodig: de
  cluster REST API (9094) is nu ook aan `127.0.0.1` gebonden op de host (zie dat
  repo's `LESSONS.md`).
- systemd-unit met `MemoryHigh=192M` / `MemoryMax=256M` + hardening
  (`NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome=yes`, `PrivateTmp=yes`).
- Oude Coolify-dashboard-container gestopt (niet verwijderd, voor rollback).

**Kritieke ontdekking tijdens verificatie:** `GET /pins` geeft een **31MB**
JSON-respons terug (3336+ gepinde CIDs). Een los request duurt ~4-5s, maar tijdens
het testen vielen drie zware requests toevallig samen (eigen diagnose-commando's +
de tracker's reguliere 60s-poll) — één daarvan overschreed de 30s-timeout en gaf
tijdelijk "Cluster data temporarily unavailable". Zodra de gelijktijdigheid wegviel,
werkte alles weer meteen zonder verdere ingreep.

**Dit bevestigt rechtstreeks de hypothese waarmee dit hele traject begon:**
de monitor (en de losse tracker-sidecar) doen allebei onafhankelijk zware
`/pins`-aanroepen; als die toevallig samenvallen met elkaar of met handmatige
`ipfs-cluster-ctl`-commando's, kan de cluster-API tijdelijk onbereikbaar lijken
zonder dat er iets kapot is. Niet opgelost in deze sessie (bewust, buiten scope
van de Coolify-migratie) — mogelijke vervolgstap: gedeelde rate-limiting/caching
tussen monitor én tracker, of een lichtere `/pins`-variant per poll.
