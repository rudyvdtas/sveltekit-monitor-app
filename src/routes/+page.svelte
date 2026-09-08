<script lang="ts">
  let data = $props() as { data: any };

  let error = $derived(data.data?.error);
  let peer = $derived(data.data?.peer);
  let peers = $derived(data.data?.peers ?? []);
  let pinStatuses = $derived(data.data?.pinStatuses ?? []);
  let pinCount = $derived(data.data?.pinCount ?? 0);
  let counts = $derived(data.data?.statusCounts ?? { pinned: 0, pinning: 0, queued: 0, error: 0 });
</script>

{#if error}
  <div class="card" style="border-color: var(--red); color: var(--red);">{error}</div>
{:else if peer}
  <h1 style="margin-bottom: 1.5rem;">
    {peer.peername}
    <span class="text-muted text-sm" style="font-weight: 400;">— {peer.ipfsId?.slice(0, 12)}...</span>
  </h1>

  <div class="grid grid-2 mb-md">
    <div class="card">
      <h2>Peers</h2>
      <div style="font-size: 2rem; font-weight: 700;">{peers.length}</div>
      <div class="text-muted text-sm">{peers.length === 1 ? '1 peer in cluster' : `${peers.length} peers in cluster`}</div>
    </div>

    <div class="card">
      <h2>Pins</h2>
      <div class="flex gap-md" style="margin-top: 0.5rem;">
        <div>
          <div style="font-size: 1.5rem; font-weight: 700;">{counts.pinned}</div>
          <span class="badge badge-success">PINNED</span>
        </div>
        <div>
          <div style="font-size: 1.5rem; font-weight: 700;">{counts.pinning}</div>
          <span class="badge badge-warning">PINNING</span>
        </div>
        <div>
          <div style="font-size: 1.5rem; font-weight: 700;">{counts.queued}</div>
          <span class="badge" style="background: rgba(88,166,255,0.15); color: var(--accent);">QUEUED</span>
        </div>
        {#if counts.error > 0}
          <div>
            <div style="font-size: 1.5rem; font-weight: 700;">{counts.error}</div>
            <span class="badge badge-error">ERROR</span>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="card mb-md">
    <h2>Cluster Peers</h2>
    <table>
      <thead>
        <tr>
          <th>Peer Name</th>
          <th>Cluster ID</th>
          <th>IPFS ID</th>
          <th>Addresses</th>
          <th>Version</th>
        </tr>
      </thead>
      <tbody>
        {#each peers as p}
          <tr>
            <td><strong>{p.peername}</strong></td>
            <td><code class="truncate" style="display:inline-block;max-width:180px;" title={p.id}>{p.id.slice(0, 16)}...</code></td>
            <td><code class="truncate" style="display:inline-block;max-width:180px;" title={p.ipfsId}>{p.ipfsId?.slice(0, 16)}...</code></td>
            <td>{p.addresses?.length ?? 0} addresses</td>
            <td class="text-muted text-sm">{p.version?.split('+')[0] ?? '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="card">
    <div class="flex-between mb-md">
      <h2 style="margin-bottom:0;">Recent Pins</h2>
      <a href="/pins">View all ({pinCount}) →</a>
    </div>
    {#if pinStatuses.length === 0}
      <p class="text-muted">No pins yet. <a href="/pins">Add your first CID</a>.</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th>CID</th>
            <th>Status</th>
            <th>Peer</th>
          </tr>
        </thead>
        <tbody>
          {#each pinStatuses.slice(0, 10) as pin}
            <tr>
              <td><code class="truncate" style="display:inline-block;max-width:300px;" title={pin.name}>{pin.cid}</code></td>
              <td>
                {#if pin.status === 'pinned'}
                  <span class="badge badge-success">PINNED</span>
                {:else if pin.status === 'pinning'}
                  <span class="badge badge-warning">PINNING</span>
                {:else if pin.status === 'queued'}
                  <span class="badge" style="background: rgba(88,166,255,0.15); color: var(--accent);">QUEUED</span>
                {:else if pin.status.includes('error')}
                  <span class="badge badge-error">{pin.status.toUpperCase()}</span>
                {:else}
                  <span class="badge">{pin.status}</span>
                {/if}
              </td>
              <td class="text-muted text-sm">{pin.peername}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
{/if}