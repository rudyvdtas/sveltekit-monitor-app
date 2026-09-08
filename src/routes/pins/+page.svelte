<script lang="ts">
  let data = $props() as { data: any };

  let pins = $derived(data.data?.pins ?? []);
  let error = $derived(data.data?.error);
  let addCid = $state('');
  let addName = $state('');
  let replMin = $state(1);
  let replMax = $state(1);
  let adding = $state(false);
  let addError = $state('');
  let removing = $state<Set<string>>(new Set());

  async function handleAdd() {
    if (!addCid.trim()) return;
    adding = true;
    addError = '';
    try {
      const res = await fetch('/api/pins/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cid: addCid.trim(),
          name: addName.trim() || undefined,
          replication_min: replMin,
          replication_max: replMax
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add pin');
      }
      window.location.reload();
    } catch (e) {
      addError = String(e);
    } finally {
      adding = false;
    }
  }

  async function handleRemove(cid: string) {
    removing.update((s) => { const n = new Set(s); n.add(cid); return n; });
    try {
      const res = await fetch('/api/pins/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cid })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove pin');
      }
      window.location.reload();
    } catch (e) {
      alert(String(e));
    } finally {
      removing.update((s) => { const n = new Set(s); n.delete(cid); return n; });
    }
  }
</script>

<h1 style="margin-bottom: 1.5rem;">Pins</h1>

<div class="card mb-md">
  <h2>Add CID</h2>
  <div class="flex gap-sm" style="flex-wrap: wrap; align-items: flex-end;">
    <div style="flex: 1; min-width: 250px;">
      <span class="text-muted text-sm">CID</span>
      <input type="text" placeholder="Qm... or bafy..." bind:value={addCid} disabled={adding} />
    </div>
    <div style="flex: 0 0 150px;">
      <span class="text-muted text-sm">Name (optional)</span>
      <input type="text" placeholder="my-file" bind:value={addName} disabled={adding} />
    </div>
    <div style="flex: 0 0 80px;">
      <span class="text-muted text-sm">Min</span>
      <select bind:value={replMin} disabled={adding}>
        {#each [1, 2, 3] as n}
          <option value={n}>{n}</option>
        {/each}
      </select>
    </div>
    <div style="flex: 0 0 80px;">
      <span class="text-muted text-sm">Max</span>
      <select bind:value={replMax} disabled={adding}>
        {#each [1, 2, 3] as n}
          <option value={n}>{n}</option>
        {/each}
      </select>
    </div>
    <div style="flex: 0 0 auto; padding-top: 1.25rem;">
      <button class="primary" onclick={handleAdd} disabled={adding || !addCid.trim()}>
        {#if adding}<span class="spinner"></span>{/if}
        Pin
      </button>
    </div>
  </div>
  {#if addError}<p style="color: var(--red); margin-top: 0.5rem;">{addError}</p>{/if}
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
          <th></th>
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
            <td style="text-align: right;">
              <button
                class="danger"
                style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
                onclick={() => handleRemove(pin.cid)}
                disabled={removing.has(pin.cid)}
              >
                {#if removing.has(pin.cid)}<span class="spinner"></span>{/if}
                Unpin
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>