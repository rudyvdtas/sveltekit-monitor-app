<script lang="ts">
  import CTA from '$lib/CTA.svelte';
  import DonationButton from '$lib/DonationButton.svelte';
  let data = $props() as { data: any };

  let pinCount = $derived(data.data?.pinCount ?? 0);
  let totalActualSizeMb = $derived(data.data?.totalActualSizeMb ?? 0);

  function formatStorage(mb: number): string {
    if (mb >= 1048576) return `~${(mb / 1048576).toFixed(2)} TB`;
    if (mb >= 1024) return `~${(mb / 1024).toFixed(1)} GB`;
    return `~${mb.toFixed(0)} MB`;
  }
</script>

<h1 style="margin-bottom: 0.25rem;">Creating Redundancy</h1>
<p class="text-muted" style="margin-bottom: 1rem;">
  Each CID in a project is replicated across multiple peers. The cluster
  automatically assigns CIDs to peers so that each stays within the
  configured replication factor. The table below shows how <strong>{pinCount.toLocaleString()} CIDs</strong>
  (or {formatStorage(totalActualSizeMb)} of content) distribute across different cluster sizes.
</p>

<div class="card" style="margin-bottom: 1.5rem;">
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
        <td>{pinCount.toLocaleString()}</td>
        <td>{formatStorage(totalActualSizeMb)}</td>
        <td>1 peer can be offline</td>
      </tr>
      <tr>
        <td>3</td>
        <td>3</td>
        <td>{pinCount.toLocaleString()}</td>
        <td>{formatStorage(totalActualSizeMb)}</td>
        <td>2 peers can be offline</td>
      </tr>
      <tr>
        <td>5</td>
        <td>3</td>
        <td>~{(pinCount * 3 / 5).toFixed(0)}</td>
        <td>{formatStorage(totalActualSizeMb * 3 / 5)}</td>
        <td>2 peers can be offline</td>
      </tr>
      <tr>
        <td>10</td>
        <td>3</td>
        <td>~{(pinCount * 3 / 10).toFixed(0)}</td>
        <td>{formatStorage(totalActualSizeMb * 3 / 10)}</td>
        <td>2 peers can be offline</td>
      </tr>
    </tbody>
  </table>
</div>

<div style="display:grid; grid-template-columns: repeat(2,1fr); gap:0.75rem; margin-bottom: 1.5rem;">
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

<div class="flex gap-sm" style="flex-wrap: wrap;">
  <CTA />
  <DonationButton />
</div>