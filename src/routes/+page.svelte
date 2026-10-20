<script lang="ts">
  import CTA from '$lib/CTA.svelte';
  import DonationButton from '$lib/DonationButton.svelte';

  let data = $props() as { data: any };
  let stats = $derived(data.data?.stats ?? null);

  function formatGb(gb: number): string {
    if (gb == null) return '—';
    if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
    return `${gb.toFixed(1)} GB`;
  }
</script>

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

{#if stats}
  <div class="stats-bar">
    <div class="stat">
      <span class="stat-value">{stats.totalCids.toLocaleString('en-US')}</span>
      <span class="stat-label">CIDs pinned</span>
    </div>
    <div class="stat">
      <span class="stat-value">{formatGb(stats.uniqueSizeGb)}</span>
      <span class="stat-label">unique data</span>
    </div>
    <div class="stat">
      <span class="stat-value">{formatGb(stats.replicatedSizeGb)}</span>
      <span class="stat-label">replicated ×{stats.replicationFactor}</span>
    </div>
  </div>
{/if}

<div class="card">
  <h2 style="margin-bottom: 0.25rem;">What is Glimmy?</h2>
  <p class="text-muted text-sm" style="margin-bottom: 1rem; line-height: 1.7; white-space: pre-line;">
    What is Glimmy? Glimmy is the live monitor for Digital Rescue Lab’s Steward Swarm — our distributed preservation network for endangered cryptoart. The Swarm uses independently operated IPFS nodes to keep multiple copies of selected artworks and their underlying data across different volunteer stewards, reducing reliance on any single platform, provider, server, device, or person. Glimmy shows what is currently pinned, how much unique data is being preserved, and how much replicated storage the network is maintaining. The aim is simple: if one node disappears, the art should not disappear with it.
  </p>
</div>

<div class="flex gap-sm" style="flex-wrap: wrap; margin-top: 0;">
  <CTA />
  <DonationButton />
</div>

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
  .stats-bar {
    display: flex;
    gap: 2rem;
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 10px;
    flex-wrap: wrap;
  }
  .stat {
    display: flex;
    flex-direction: column;
  }
  .stat-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--accent);
  }
  .stat-label {
    font-size: 0.78rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
