<script lang="ts">
  let data = $props() as { data: any };
  let pins = $derived(data.data?.pins ?? []);
  let error = $derived(data.data?.error);
  let showList = $state(false);
  let gateway = $derived('https://ipfs.io/ipfs/');
</script>

<h1 style="margin-bottom: 1.5rem;">DRL coordinator</h1>

<div class="card mb-md">
  <div class="flex-between">
    <h2>Curated CIDs ({pins.length})</h2>
    <button onclick={() => showList = !showList} class="primary" style="font-size: 0.8rem;">
      {showList ? 'Verberg lijst' : 'Toon CID lijst'}
    </button>
  </div>
  {#if showList && pins.length > 0}
    <div class="cid-list card" style="margin-top: 1rem; background: var(--bg); max-height: 400px; overflow-y: auto;">
      <pre><code>{#each pins as pin, i}{i + 1}. <a href="{gateway}{pin.cid}" target="_blank" rel="noopener">{pin.cid}</a>{"\n"}{/each}</code></pre>
    </div>
  {/if}
</div>

<div class="card">
  <h2>Pinned CIDs ({pins.length})</h2>
  {#if error}
    <p style="color: var(--red);">{error}</p>
  {:else if pins.length === 0}
    <p class="text-muted">No pinned CIDs.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>CID</th>
          <th>Replication</th>
          <th>Peers</th>
        </tr>
      </thead>
      <tbody>
        {#each pins as pin}
          {@const peerEntries = Object.entries(pin.peer_map ?? {})}
          <tr>
            <td>
              <div>
                <a href="{gateway}{pin.cid}" target="_blank" rel="noopener" title="Open via IPFS gateway">
                  <code class="truncate" style="display:inline-block;max-width:350px;color:var(--accent);">{pin.cid}</code>
                </a>
              </div>
            </td>
            <td><span class="text-sm">min {pin.replication_factor_min} / max {pin.replication_factor_max}</span></td>
            <td>
              <div class="flex gap-sm" style="flex-wrap: wrap;">
                {#each peerEntries as [, info]}
                  <span
                    class="truncate badge {info.status === 'pinned' ? 'badge-success' : info.status === 'pinning' ? 'badge-warning' : info.status.includes('error') ? 'badge-error' : ''}"
                    style="max-width: 180px;"
                    title="{info.peername}: {info.status}"
                  >
                    {info.peername}: {info.status}
                  </span>
                {/each}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="text-muted text-sm" style="margin-top: 0.5rem;">
      CIDs openen via <a href="{gateway}" target="_blank" rel="noopener">ipfs.io</a> gateway.
    </p>
  {/if}
</div>