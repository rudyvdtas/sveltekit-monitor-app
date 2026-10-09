<script lang="ts">
  import CTA from '$lib/CTA.svelte';
  import DonationButton from '$lib/DonationButton.svelte';
  let data = $props() as { data: any };
  let allProjects = $derived(data.data?.projects ?? []);
  let activeId = $derived(data.data?.activeId ?? '');
  let page = $derived(data.data?.page ?? 1);
  let perPage = $derived(data.data?.perPage ?? 50);
  let pagedCids = $derived(data.data?.pagedCids ?? []);
  let totalPages = $derived(data.data?.totalPages ?? 0);
  let pinStatusMap = $derived(data.data?.pinStatusMap ?? {});
  let groupLogos = $derived(data.data?.groupLogos ?? {});

  let groups = $derived(['async', 'knownorigin', 'fails']);
  let activeProject = $derived(allProjects.find((p: any) => p.id === activeId));
  let activeGroup = $derived(activeProject?.group ?? 'async');
  let groupProjects = $derived(allProjects.filter((p: any) => p.group === activeGroup));

  let showKov2 = $state(activeId.startsWith('knownorigin-v2-batch-'));
  let kov2Projects = $derived(groupProjects.filter((p: any) => p.id.startsWith('knownorigin-v2-batch-')));
  let knownoriginV1 = $derived(groupProjects.find((p: any) => p.id === 'knownorigin-v1'));
  let otherProjects = $derived(activeGroup !== 'knownorigin' ? groupProjects : knownoriginV1 ? [knownoriginV1] : []);

  function formatSize(mb: number | null): string {
    if (mb == null) return '—';
    if (mb < 1) return `${(mb * 1000).toFixed(0)} KB`;
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  }

  function projectUrl(id: string): string {
    const p = new URLSearchParams();
    p.set('project', id);
    p.set('page', '1');
    return `?${p.toString()}`;
  }

  function groupUrl(g: string): string {
    const first = allProjects.find((p: any) => p.group === g);
    return first ? projectUrl(first.id) : '?';
  }

  function linkify(text: string): string {
    return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function pageUrl(n: number): string {
    const p = new URLSearchParams();
    p.set('project', activeId);
    p.set('page', String(n));
    return `?${p.toString()}`;
  }

  let pages = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));
</script>

<h1 style="margin-bottom: 0.25rem;">Projects</h1>
<p class="text-muted" style="margin-bottom: 1rem;">
  Curated CIDs grouped by platform — each project's content is replicated across volunteer peers.
</p>

<div class="group-tabs">
  {#each groups as g}
    <a href={groupUrl(g)} class="group-tab {activeGroup === g ? 'active' : ''}" role="button">
      {#if g === 'fails'}
        <span class="emoji-logo">🚨</span> FAILS
      {:else}
        <img src={groupLogos[g]} alt={g} class="group-logo" />
      {/if}
    </a>
  {/each}
</div>

<div class="tabs">
  {#each otherProjects as project}
    <a
      href={projectUrl(project.id)}
      class="tab {activeId === project.id ? 'active' : ''}"
      role="button"
    >
      {project.name}
    </a>
  {/each}
  {#if activeGroup === 'knownorigin' && kov2Projects.length > 0}
    <button class="tab dropdown-toggle" onclick={() => (showKov2 = !showKov2)} role="button">
      KOV2 {showKov2 ? '▲' : '▼'}
    </button>
    {#if showKov2}
      {#each kov2Projects as project}
        <a
          href={projectUrl(project.id)}
          class="tab {activeId === project.id ? 'active' : ''}"
          role="button"
        >
          {project.name}
        </a>
      {/each}
    {/if}
  {/if}
</div>

{#if activeProject}
  <div class="card card-accent" style="margin-bottom: 1rem;">
    <div class="flex-between" style="margin-bottom: 0.5rem;">
      <div class="flex gap-sm" style="align-items: flex-start;">
        {#if activeProject.image}
          <img
            src={activeProject.image}
            alt={activeProject.name}
            style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; flex-shrink: 0;"
          />
        {/if}
        <div>
          <strong style="font-size: 1rem;">{activeProject.name}</strong>
          <p class="text-muted text-sm" style="margin-top: 0.25rem; white-space: pre-line;">{@html linkify(activeProject.description)}</p>
        </div>
      </div>
      <div class="badge badge-info">{activeProject.totalCids} CIDs</div>
    </div>
  </div>

  {#if pagedCids.length > 0}
    <div class="card" style="margin-bottom: 1rem;">
      <div class="flex-between mb-md">
        <h2>Curated CIDs ({activeProject.totalCids})</h2>
        <span class="text-muted text-sm">Page {page} of {totalPages}</span>
      </div>
      <div style="max-height: 450px; overflow-y: auto; margin-top: 0.5rem;">
        <table>
          <thead>
            <tr>
              <th>CID</th>
              <th>Artwork / Layer</th>
              <th>Artist</th>
              <th>Size</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {#each pagedCids as cid}
              {@const info = activeProject.meta?.[cid]}
              {@const ee = activeProject.enrichedEntries?.[cid]}
              {@const ps = pinStatusMap[cid] ?? { pinnedCount: 0, totalPeers: 0 }}
              {@const ratio = ps.totalPeers > 0 ? ps.pinnedCount / ps.totalPeers : 0}
              <tr>
                <td>
                  <a href="https://dweb.link/ipfs/{cid}" target="_blank" rel="noopener" title="Open via IPFS gateway">
                    <code style="color:var(--accent);">{cid.slice(0, 30)}...</code>
                  </a>
                </td>
                <td>
                  {#if ee?.layerName}
                    {ee.layerName}
                    {#if ee?.optionLabel}
                      <span class="text-muted text-sm">({ee.optionLabel})</span>
                    {/if}
                  {:else if ee?.tokenName}
                    {ee.tokenName}
                  {:else if info?.artworkName}
                    {info.artworkName}
                  {:else}
                    <span class="text-muted">—</span>
                  {/if}
                </td>
                <td>
                  {#if ee?.artist}
                    {ee.artist}
                  {:else if info?.artist}
                    {info.artist}
                  {:else}
                    <span class="text-muted">—</span>
                  {/if}
                </td>
                <td>
                  <span class="text-muted text-sm">{formatSize(ee?.sizeMb)}</span>
                </td>
                <td>
                  {#if ee?.type}
                    <span class="badge">{ee.type}</span>
                  {:else}
                    <span class="text-muted">—</span>
                  {/if}
                </td>
                <td>
                  {#if ratio >= 1}
                    <span class="badge badge-success">{ps.pinnedCount}/{ps.totalPeers}</span>
                  {:else if ratio > 0}
                    <span class="badge badge-warning">{ps.pinnedCount}/{ps.totalPeers}</span>
                  {:else}
                    <span class="badge">{ps.pinnedCount}/{ps.totalPeers}</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if totalPages > 1}
        <div class="pagination" style="margin-top: 0.75rem; display:flex; gap:0.25rem; flex-wrap:wrap;">
          {#if page > 1}
            <a href={pageUrl(page - 1)} class="button-like" style="font-size:0.8rem;">← Prev</a>
          {/if}
          {#each pages as n}
            {#if n === page}
              <span style="padding:0.25rem 0.5rem; font-weight:700;">{n}</span>
            {:else if n === 1 || n === totalPages || (n >= page - 2 && n <= page + 2)}
              <a href={pageUrl(n)} style="padding:0.25rem 0.5rem;">{n}</a>
            {:else if n === page - 3 || n === page + 3}
              <span style="padding:0.25rem 0.5rem;">…</span>
            {/if}
          {/each}
          {#if page < totalPages}
            <a href={pageUrl(page + 1)} class="button-like" style="font-size:0.8rem;">Next →</a>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
{/if}

<div class="flex gap-sm" style="flex-wrap: wrap;">
  <CTA />
  <DonationButton />
</div>

<style>
  a.button-like {
    display: inline-block;
    background: var(--accent);
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background 0.15s;
  }
  a.button-like:hover {
    background: var(--accent-dark);
    color: #fff;
  }
  a.tab, button.tab {
    text-decoration: none;
    display: inline-block;
    padding: 0.4rem 0.9rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: 8px;
    transition: all 0.15s;
  }
  a.tab:hover, button.tab:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
  a.tab.active, button.tab.active {
    background: var(--accent);
    color: #fff;
  }
  button.dropdown-toggle {
    background: var(--bg-card);
    border: 1px solid var(--border);
    font-size: 0.78rem;
    padding: 0.4rem 0.7rem;
  }
  button.dropdown-toggle:hover {
    background: var(--accent);
    color: #fff;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    margin-bottom: 0.5rem;
  }
  .group-tabs {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.25rem;
  }
  .group-tab {
    display: inline-block;
    padding: 0.5rem 1.25rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.15s;
  }
  .group-tab:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
  .group-tab.active {
    background: var(--accent);
    color: #fff;
  }
  .group-logo {
    width: 22px;
    height: 22px;
    object-fit: contain;
    vertical-align: middle;
    margin-right: 2px;
  }
  .emoji-logo {
    font-size: 1.2rem;
    vertical-align: middle;
  }
</style>