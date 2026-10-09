<script lang="ts">
  import CTA from '$lib/CTA.svelte';
  import DonationButton from '$lib/DonationButton.svelte';
  let data = $props() as { data: any };

  let error = $derived(data.data?.error);
  let cluster = $derived(data.data?.cluster);
  let peers = $derived(data.data?.peers ?? []);
  let volunteers = $derived(data.data?.volunteers ?? 0);
  let recentPins = $derived(data.data?.recentPins ?? []);
  let pinCount = $derived(data.data?.pinCount ?? 0);
  let counts = $derived(data.data?.statusCounts ?? { pinned: 0, pinning: 0, queued: 0, error: 0 });
  let failedCids = $derived(data.data?.failedCids ?? []);
  let totalActualSizeMb = $derived(data.data?.totalActualSizeMb ?? 0);

  function formatStorage(mb: number): string {
    if (mb >= 1048576) return `~${(mb / 1048576).toFixed(2)} TB`;
    if (mb >= 1024) return `~${(mb / 1024).toFixed(1)} GB`;
    return `~${mb.toFixed(0)} MB`;
  }
</script>

{#if error}
  <div class="card" style="border-color: var(--red); color: var(--red);">{error}</div>
{:else if cluster}
  <div class="banner">
    <div class="banner-track">
      <span class="banner-logo">makersplace</span>
      <span class="banner-logo">async</span>
      <span class="banner-logo">knownorigin</span>
      <span class="banner-logo">??</span>
      <span class="banner-logo">makersplace</span>
      <span class="banner-logo">async</span>
      <span class="banner-logo">knownorigin</span>
      <span class="banner-logo">??</span>
      <span class="banner-logo">makersplace</span>
      <span class="banner-logo">async</span>
      <span class="banner-logo">knownorigin</span>
      <span class="banner-logo">??</span>
    </div>
  </div>

  <div class="grid grid-3 mb-md">
    <div class="card card-accent">
      <h2>Peers</h2>
      <div style="font-size: 2rem; font-weight: 700;">{peers.length}</div>
      <div class="text-muted text-sm">{peers.length === 1 ? '1 peer in cluster' : `${peers.length} peers in cluster`}</div>
    </div>

    <div class="card card-accent">
      <h2>Volunteers</h2>
      <div style="font-size: 2rem; font-weight: 700;">{volunteers}</div>
      <div class="text-muted text-sm">{volunteers === 0 ? 'No volunteers yet' : `${volunteers} volunteer${volunteers !== 1 ? 's' : ''} online`}</div>
    </div>

    <div class="card card-accent">
      <h2>Pins</h2>
      <div style="font-size: 2rem; font-weight: 700;">{pinCount.toLocaleString()}</div>
      <div class="text-muted text-sm">{pinCount.toLocaleString()} CIDs, {formatStorage(totalActualSizeMb)} total</div>
      {#if counts.error > 0}
        <p class="text-sm" style="margin-top: 0.5rem; color: var(--red);">
          {counts.error} error{counts.error > 1 ? 's' : ''} — {counts.pinning} pinning, {counts.queued} queued
        </p>
      {/if}
    </div>
  </div>

  <div class="card">
    <h2 style="margin-bottom: 0.25rem;">About Digital Rescue Lab</h2>
    <p class="text-muted text-sm" style="margin-bottom: 1rem; line-height: 1.7; white-space: pre-line;">
      Digital Rescue Lab is an initiative led by artists and creative technologists rooted in the cryptoart community. We are working to recover, stabilize, and preserve early blockchain artworks that are disappearing as the platforms and infrastructure they depend on fail.

      Our first restoration, the Arcana Crypto Tarot, proved that recovery is possible. We've since rebuilt a public viewer for Async Classic (V1/V2) artworks, restoring viewing and layer functionality that had broken down.

      We have also written a document laying out the scope of the cryptoart conservation challenge, noting work in progress as well as a starting strategy. We have shared it with the public because, just as with traditional art conservation, this is a collective responsibility: it belongs to artists, collectors, platforms, and anyone who cares about art and digital culture — particularly this strange and genuinely significant moment in art history. <a href="https://app.notion.com/p/Cryptoart-Conservation-Overview-Current-Efforts-August-2026-3cb5139de07c8172ab6bc6dea803d14e?source=copy_link" target="_blank" rel="noopener">Read here &gt;&gt;&gt;</a>

      This page is a fixed starting point. For ongoing progress and the full picture, see our <a href="https://karenfranceseng.notion.site/drl?v=2f55139de07c807f9765000c982e94a4" target="_blank" rel="noopener">Notion Overview</a> — our hub for information and updates.
    </p>
  </div>

  {#if failedCids.length > 0}
    <div class="card" style="border-color: var(--red);">
      <div class="flex-between mb-md">
        <h2 style="margin-bottom:0; color:var(--red);">Failed CIDs</h2>
        <span class="badge badge-error">{failedCids.length} failed</span>
      </div>
      <p class="text-muted text-sm" style="margin-bottom: 0.75rem;">
        These CIDs have been unpinned after repeated errors. The tracker
        monitors them automatically.
      </p>
      <table>
        <thead>
          <tr>
            <th>CID</th>
            <th>Project</th>
          </tr>
        </thead>
        <tbody>
          {#each failedCids as fc}
            <tr>
              <td><code>{fc.cid.slice(0, 28)}</code></td>
              <td>
                {#if fc.projectName}
                  <span class="badge badge-info">{fc.projectName}</span>
                {:else}
                  <span class="text-muted text-sm">—</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <div class="flex gap-sm" style="flex-wrap: wrap; margin-top: 0;">
    <CTA />
    <DonationButton />
  </div>
{/if}

<style>
  .banner {
    overflow: hidden;
    height: 1.6rem;
    display: flex;
    align-items: center;
  }
  .banner-track {
    display: flex;
    align-items: center;
    gap: 4rem;
    white-space: nowrap;
    animation: scrollBanner 40s linear infinite;
  }
  .banner-logo {
    font-family: var(--font);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #999;
    opacity: 0.45;
  }
  @keyframes scrollBanner {
    0% { transform: translateX(0); }
    100% { transform: translateX(-33.33%); }
  }
</style>