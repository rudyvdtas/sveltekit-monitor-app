# Performance review en fix-to-do

## Context

Deze repository is een SvelteKit-dashboard voor IPFS Cluster. Er is een incident geweest waarbij de VPS vastliep. Dit document bevat de statische bevindingen uit de codebase en een uitvoerbare prompt voor een coding agent.

> Dit is een statische code-review. Controleer de bevindingen tegen VPS-, Docker-, kernel- en IPFS Cluster-metrics rond het incident.

## Belangrijkste bevinding

De meest waarschijnlijke codegerelateerde oorzaak is dat meerdere pagina's bij iedere server-side page load de volledige `/pins`-dataset ophalen en verwerken:

- `src/routes/+page.server.ts` doet `/id`, `/peers` en `/pins`.
- `src/routes/projects/+page.server.ts` doet opnieuw `/pins`.
- `src/routes/volunteer/+page.server.ts` doet opnieuw `/peers` en `/pins`.
- `src/lib/server/cluster.ts` leest de volledige `/pins`-response eerst als tekst in, splitst newline-JSON, parseert alles en retourneert de volledige dataset.
- Daarna wordt per request opnieuw door alle pins en alle `peer_map`-entries gelopen.

Bij een grote pinset of meerdere gelijktijdige bezoekers kan dit leiden tot hoge tijdelijke RAM-consumptie, CPU-belasting en veel upstream requests. De IPFS Kubo/Cluster-processen, replicatie en eventuele rebalance blijven daarnaast belangrijke mogelijke oorzaken en moeten worden gemeten.

## Bevindingen

### Hoogste prioriteit: volledige pinset per request

`getPins()` heeft een response-limiet van 5 MB, maar een JSON-response van 5 MB kan na `res.text()`, `trim()`, `split()`, JSON parsing en objectverwerking aanzienlijk meer geheugen gebruiken. Meerdere gelijktijdige requests kunnen de VPS daardoor laten swappen of een OOM-kill veroorzaken.

### Geen gedeelde server-side cache

De drie page-loads gebruiken dezelfde clusterdata maar delen geen cache. Navigatie, crawlers, healthchecks of meerdere gebruikers kunnen herhaaldelijk dezelfde zware `/pins`-request veroorzaken.

### Geen bescherming tegen gelijktijdige cache-misses

Zelfs na het toevoegen van een eenvoudige TTL-cache zouden gelijktijdige requests de cache tegelijk kunnen vullen. Gebruik daarom een gedeelde in-flight Promise of vergelijkbare single-flight bescherming.

### Geen rate limiting of concurrency-limiet

Er is een timeout van 10 seconden, maar geen dashboard-rate-limit en geen limiet op het aantal gelijktijdige requests naar de cluster-API. Een publiek dashboard kan daardoor de cluster en Node-runtime extra belasten.

### Volledige `peer_map` wordt verwerkt en doorgestuurd

De dashboard- en projectpagina verwerken per pin alle peer-statussen. Dit is functioneel begrijpelijk, maar wordt duur bij veel pins en peers. De browser krijgt bovendien veel data die niet altijd direct nodig is.

### Deploymentcontrole vereist

Controleer of op de VPS meerdere Kubo- of IPFS Cluster-instances draaien. De documentatie beschrijft configuraties met extra Kubo- en Cluster-processen. Controleer ook Docker resource limits, swap, diskruimte en netwerkbelasting.

## Aanbevolen implementatie

1. Voeg een gecentraliseerde server-side cache toe voor `getId()`, `getPeers()` en vooral `getPins()`.
2. Gebruik een korte TTL, bijvoorbeeld 15 seconden, met single-flight bescherming tegen gelijktijdige cache-misses.
3. Voeg expliciete maximumlimieten toe voor het aantal pins en peer allocations dat de applicatie accepteert/verwerkt. Houd de bestaande byte-limiet aan.
4. Gebruik waar de cluster-API dit ondersteunt pagination, server-side filtering of een samenvattend endpoint.
5. Voeg rate limiting toe op dashboardroutes of via Traefik; voeg minimaal een limiet toe op gelijktijdige clusterrequests.
6. Stuur voor het dashboard alleen de velden die werkelijk nodig zijn.
7. Voeg metrics/logging toe voor requestduur, responsegrootte, aantal pins, aantal peer allocations, cache hits/misses en actieve clusterrequests. Log geen gevoelige inhoud.
8. Voeg tests toe voor caching, single-flight gedrag, timeout, oversized response, malformed JSON en limietoverschrijding.
9. Controleer de oplossing met load tests en vergelijk CPU/RAM vóór en na de wijziging.
10. Documenteer dat de VPS ook buiten de dashboardcode gecontroleerd moet worden op OOM-kills en zware Kubo/Cluster-processen.

## Validatie na de fix

Voer minimaal het volgende uit:

```bash
npm ci
npm run check
npm run test
npm run build
```

Controleer op de VPS:

```bash
docker stats
journalctl -k --since "24 hours ago" | grep -Ei "oom|out of memory|killed process"
dmesg -T | grep -Ei "oom|out of memory|killed process"
```

Meet ook de grootte en duur van `/pins` en test gelijktijdige requests tegen `/`, `/projects` en `/volunteer`.

---

# Fix-to-do prompt voor de coding agent

Je werkt in repository `rudyvdtas/sveltekit-monitor-app`. Implementeer een production-ready performance- en resourcegebruikfix voor het risico dat de VPS vastloopt door herhaalde en grote IPFS Cluster `/pins`-requests.

## Doel

Verminder CPU-, RAM- en netwerkbelasting zonder de bestaande dashboardfunctionaliteit te breken. De oplossing moet veilig omgaan met grote responses, gelijktijdige requests, trage cluster-API's en foutieve data.

## Opdracht

1. Inspecteer eerst de huidige implementatie van:
   - `src/lib/server/cluster.ts`
   - `src/routes/+page.server.ts`
   - `src/routes/projects/+page.server.ts`
   - `src/routes/volunteer/+page.server.ts`
   - relevante tests, package scripts en deploymentbestanden.
2. Voeg een gedeelde server-side cache toe voor clusterdata, met:
   - configureerbare TTL via environment variable, standaard ongeveer 15 seconden;
   - caching van succesvolle resultaten;
   - geen caching van foutresponses;
   - single-flight gedrag zodat gelijktijdige cache-misses niet allemaal `/pins` ophalen;
   - duidelijke invalidatie of korte TTL na `addPin` en `removePin`.
3. Zorg dat `/pins` niet onbeperkt door parsing en verwerking kan groeien:
   - behoud of verbeter de byte-limiet;
   - voeg een configureerbare maximumlimiet toe voor het aantal pins;
   - voeg een configureerbare maximumlimiet toe voor peer allocations/status entries indien passend;
   - fail closed met een gecontroleerde fout wanneer limieten worden overschreden;
   - voorkom onnodige kopieën van de volledige response waar praktisch mogelijk.
4. Verminder dubbele verwerking en payloadgrootte:
   - hergebruik de cache in alle drie de page-loads;
   - stuur alleen noodzakelijke velden naar de browser;
   - behoud de bestaande zichtbare functionaliteit.
5. Voeg bescherming toe tegen overbelasting:
   - implementeer een eenvoudige limiet op gelijktijdige clusterrequests, of documenteer waarom de gekozen aanpak voldoende is;
   - voeg route-rate-limiting toe als dit past binnen de bestaande SvelteKit-architectuur, anders geef een concrete Traefik-configuratie-aanbeveling in de documentatie;
   - behoud de bestaande timeout en maak die configureerbaar.
6. Voeg observability toe zonder gevoelige data te loggen:
   - requestduur;
   - endpoint;
   - responsegrootte;
   - cache hit/miss;
   - aantal pins;
   - aantal afgewezen requests wegens limieten.
7. Voeg tests toe voor:
   - cache hit binnen TTL;
   - cache miss na TTL;
   - single-flight bij gelijktijdige calls;
   - cache wordt niet gevuld na een fout;
   - timeout/abort;
   - response boven de byte-limiet;
   - te veel pins;
   - malformed JSON/NDJSON;
   - cache-invalidatie na pin-mutaties.
8. Controleer types en SvelteKit-conventies. Gebruik geen `any` waar een veilige bestaande type-definitie mogelijk is.
9. Werk documentatie bij met:
   - nieuwe environment variables en defaults;
   - aanbevolen VPS/Docker resource monitoring;
   - commands om OOM-kills te controleren;
   - expliciete opmerking dat Kubo/IPFS Cluster zelf ook gemonitord moet worden.
10. Draai alle beschikbare checks en tests. Rapporteer exact wat is uitgevoerd en wat eventueel niet uitvoerbaar was.

## Acceptatiecriteria

- Een normale page load veroorzaakt geen aparte `/pins`-request per pagina wanneer de cache geldig is.
- Gelijktijdige cache-misses veroorzaken maximaal één upstream request per resource.
- Grote of ongeldige responses kunnen de Node-processen niet onbeperkt laten groeien.
- Timeouts en upstream fouten laten geen stale foutresultaat in de cache achter.
- Bestaande dashboard-, projecten- en volunteer-functionaliteit blijft werken.
- Er zijn tests voor de nieuwe resource- en foutpaden.
- De implementatie introduceert geen background polling, recursie of nieuwe onbeperkte loops.
- De agent maakt een overzicht van gewijzigde bestanden, testresultaten, resterende risico's en eventuele noodzakelijke VPS/Docker-configuratie buiten deze repository.

## Belangrijke randvoorwaarde

Maak geen aannames dat de dashboardcode de enige oorzaak van het incident is. Als code-inspectie geen verklaring geeft voor hoge CPU of RAM, benoem dan expliciet dat metingen nodig zijn voor Kubo, IPFS Cluster, Docker, Traefik, disk I/O, netwerkverkeer en de Linux OOM-killer.
