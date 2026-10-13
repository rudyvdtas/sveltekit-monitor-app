<script lang="ts">
  import CTA from '$lib/CTA.svelte';
  import DonationButton from '$lib/DonationButton.svelte';
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

<div class="card">
  <h2 style="margin-bottom: 0.25rem;">About Digital Rescue Lab</h2>
  <p class="text-muted text-sm" style="margin-bottom: 1rem; line-height: 1.7; white-space: pre-line;">
    Digital Rescue Lab is an initiative led by artists and creative technologists rooted in the cryptoart community. We are working to recover, stabilize, and preserve early blockchain artworks that are disappearing as the platforms and infrastructure they depend on fail.

    Our first restoration, the Arcana Crypto Tarot, proved that recovery is possible. We've since rebuilt a public viewer for Async Classic (V1/V2) artworks, restoring viewing and layer functionality that had broken down.

    We have also written a document laying out the scope of the cryptoart conservation challenge, noting work in progress as well as a starting strategy. We have shared it with the public because, just as with traditional art conservation, this is a collective responsibility: it belongs to artists, collectors, platforms, and anyone who cares about art and digital culture — particularly this strange and genuinely significant moment in art history. <a href="https://app.notion.com/p/Cryptoart-Conservation-Overview-Current-Efforts-August-2026-3cb5139de07c8172ab6bc6dea803d14e?source=copy_link" target="_blank" rel="noopener">Read here &gt;&gt;&gt;</a>

    This page is a fixed starting point. For ongoing progress and the full picture, see our <a href="https://karenfranceseng.notion.site/drl?v=2f55139de07c807f9765000c982e94a4" target="_blank" rel="noopener">Notion Overview</a> — our hub for information and updates.
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
</style>
