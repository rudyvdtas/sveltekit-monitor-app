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

  function formatStorage(cids: number): string {
    const tb = cids * 0.001;
    if (tb >= 1) return `~${tb.toFixed(1)} TB`;
    const gb = cids * 1;
    if (gb >= 1) return `~${gb.toFixed(0)} GB`;
    return `~${cids * 1000} MB`;
  }
</script>

{#if error}
  <div class="card" style="border-color: var(--red); color: var(--red);">{error}</div>
{:else if cluster}
  <h1 style="margin-bottom: 0.25rem;">DRL Co&ouml;rdinator</h1>
  <p class="text-muted" style="margin-bottom: 1.5rem;">
    {cluster.peername}
  </p>

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
      <div class="text-muted text-sm">{pinCount.toLocaleString()} CIDs, ~{formatStorage(pinCount)} total</div>
      {#if counts.error > 0}
        <p class="text-sm" style="margin-top: 0.5rem; color: var(--red);">
          {counts.error} error{counts.error > 1 ? 's' : ''} — {counts.pinning} pinning, {counts.queued} queued
        </p>
      {/if}
    </div>
  </div>

  <div class="card mb-md">
    <div class="flex-between mb-md">
      <h2 style="margin-bottom:0;">Cluster Peers</h2>
    </div>
    <table>
      <thead>
        <tr>
          <th>Peer Name</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {#each peers as p, i}
          <tr>
            <td><strong>{p.peername}</strong></td>
            <td>
              {#if i === 0}
                <span class="badge badge-warning">Coordinator</span>
              {:else}
                <span class="badge badge-info">Volunteer</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="card">
    <div class="flex-between mb-md">
      <h2 style="margin-bottom:0;">Activity on Volunteers</h2>
      <a href="/projects">View Projects →</a>
    </div>
    {#if recentPins.length === 0}
      <p class="text-muted">No CIDs pinned yet. No volunteers connected.</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th>CID</th>
            <th>Project</th>
          </tr>
        </thead>
        <tbody>
          {#each recentPins as pin}
            <tr>
              <td>
                <a href="https://dweb.link/ipfs/{pin.cid}" target="_blank" rel="noopener" title="Open via IPFS gateway">
                  <code style="color:var(--accent);">{pin.cid.slice(0, 28)}</code>
                </a>
              </td>
              <td>
                {#if pin.projectName}
                  <span class="badge badge-info">{pin.projectName}</span>
                {:else}
                  <span class="text-muted text-sm">—</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
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

  <div class="card">
    <h2>Creating Redundancy</h2>
    <p class="text-muted text-sm" style="margin-bottom: 1rem;">
      Each CID in a project is replicated across multiple peers. The cluster
      automatically assigns CIDs to peers so that each stays within the
      configured replication factor. The table below shows how <strong>{Math.max(pinCount, 1000)} CIDs</strong>
      (or ~1 TB of content) distribute across different cluster sizes.
    </p>

    <table>
      <thead>
        <tr>
          <th>Peers</th>
          <th>Replication</th>
          <th>CIDs per peer</th>
          <th>Storage per peer</th>
          <th>Offline resilience</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>2</td>
          <td>2</td>
          <td>{Math.max(pinCount, 1000)}</td>
          <td>~1 TB</td>
          <td>1 peer can be offline</td>
        </tr>
        <tr>
          <td>3</td>
          <td>3</td>
          <td>{Math.max(pinCount, 1000)}</td>
          <td>~1 TB</td>
          <td>2 peers can be offline</td>
        </tr>
        <tr>
          <td>5</td>
          <td>3</td>
          <td>~600</td>
          <td>~600 GB</td>
          <td>2 peers can be offline</td>
        </tr>
        <tr>
          <td>10</td>
          <td>3</td>
          <td>~300</td>
          <td>~300 GB</td>
          <td>2 peers can be offline</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 1rem; display:grid; grid-template-columns: repeat(2,1fr); gap:0.75rem;">
      <div class="card" style="border-left: 3px solid var(--green-light);">
        <strong style="font-size:0.9rem;">Partial uptime</strong>
        <p class="text-muted text-sm" style="margin-top:0.25rem;">
          With replication ≥ 2, no CID becomes unavailable when a peer goes offline.
          The other peer(s) still host the content. When the peer returns, it
          resumes hosting. Run <code>rebalance.sh</code> after a long absence
          to restore full coverage.
        </p>
      </div>
      <div class="card" style="border-left: 3px solid var(--green-light);">
        <strong style="font-size:0.9rem;">Scaling up</strong>
        <p class="text-muted text-sm" style="margin-top:0.25rem;">
          More peers = less storage per peer. The coordinator (trusted peer) sets the target
          via <code>scripts/rebalance.sh</code> which redistributes CIDs across
          all available peers up to replication 3.
        </p>
      </div>
    </div>
  </div>

  <div class="flex gap-sm" style="flex-wrap: wrap; margin-top: 0;">
    <CTA />
    <DonationButton />
  </div>
{/if}