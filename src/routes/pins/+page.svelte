<script lang="ts">
  let data = $props() as { data: any };
  let pins = $derived(data.data?.pins ?? []);
  let error = $derived(data.data?.error);
</script>

<h1 style="margin-bottom: 1.5rem;">Curated CIDs</h1>

<div class="card mb-md" style="background: rgba(88,166,255,0.05); border-color: var(--accent);">
  <p class="text-muted text-sm">
    Deze lijst wordt beheerd via <code>curated-cids.json</code> in de 
    <a href="https://github.com/rudyvdtas/ipfs-cluster-coordinator" target="_blank">coordinator repo</a>.
    CIDs toevoegen of verwijderen doe je door dat bestand aan te passen en te pushen.
    Het sync-script op de server pint de wijzigingen automatisch.
  </p>
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
              <div><code class="truncate" style="display:inline-block;max-width:350px;" title={pin.cid}>{pin.cid}</code></div>
              {#if pin.name && pin.name !== pin.cid}
                <div class="text-muted text-sm">{pin.name}</div>
              {/if}
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
  {/if}
</div>