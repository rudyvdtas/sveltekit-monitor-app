<script lang="ts">
  import CTA from '$lib/CTA.svelte';
  let data = $props() as { data: any };
  let allProjects = $derived(data.data?.projects ?? []);
  let activeTab = $state(allProjects.length > 0 ? allProjects[0].id : null);
  let showCids = $state(false);

  let activeProject = $derived(allProjects.find((p: any) => p.id === activeTab));
</script>

<h1 style="margin-bottom: 0.25rem;">Projects</h1>
<p class="text-muted" style="margin-bottom: 1rem;">
  Curated CIDs grouped by project — each project's content is replicated across volunteer peers.
</p>

<div class="tabs">
  {#each allProjects as project}
    <button
      class="tab {activeTab === project.id ? 'active' : ''}"
      onclick={() => { activeTab = project.id; showCids = false; }}
    >
      {project.name}
    </button>
  {/each}
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
          <p class="text-muted text-sm" style="margin-top: 0.25rem;">{activeProject.description}</p>
        </div>
      </div>
      <div class="badge badge-info">{activeProject.cids.length} CIDs</div>
    </div>
    <button
      class="primary"
      style="font-size: 0.8rem; margin-top: 0.5rem;"
      onclick={() => showCids = !showCids}
    >
      {showCids ? 'Hide CID list' : 'Show CID list'}
    </button>
  </div>

  {#if showCids && activeProject.cids.length > 0}
    <div class="card" style="margin-bottom: 1rem;">
      <h2>Curated CIDs ({activeProject.cids.length})</h2>
      <div style="max-height: 350px; overflow-y: auto; margin-top: 0.5rem;">
        <table>
          <thead>
            <tr>
              <th>CID</th>
              <th>Artwork</th>
              <th>Artist</th>
            </tr>
          </thead>
          <tbody>
            {#each activeProject.cids as cid}
              {@const info = activeProject.meta?.[cid]}
              <tr>
                <td>
                  <a href="https://dweb.link/ipfs/{cid}" target="_blank" rel="noopener" title="Open via IPFS gateway">
                    <code style="color:var(--accent);">{cid.slice(0, 30)}...</code>
                  </a>
                </td>
                <td>
                  {#if info?.artworkName}
                    {info.artworkName}
                  {:else}
                    <span class="text-muted">—</span>
                  {/if}
                </td>
                <td>
                  {#if info?.artist}
                    {info.artist}
                  {:else}
                    <span class="text-muted">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
{/if}

<CTA />