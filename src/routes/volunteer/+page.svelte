<script lang="ts">
  let data = $props() as { data: any };
  let volunteers = $derived(data.data.volunteers ?? 0);
  let cidCount = $derived(data.data.cidCount ?? 0);
  let peerCount = $derived(data.data.peerCount ?? 1);
</script>

<h1 style="margin-bottom: 0.25rem;">Volunteer</h1>
<p class="text-muted" style="margin-bottom: 1.5rem;">
  {volunteers === 0 ? 'No volunteers yet — be the first!' : `${volunteers} active volunteer${volunteers > 1 ? 's' : ''}`}
  · {peerCount} peer{peerCount > 1 ? 's' : ''} · {cidCount} CIDs
</p>

<div class="card mb-md card-accent">
  <h2>Requirements</h2>
  <table>
    <thead>
      <tr><th>Item</th><th>Minimum</th></tr>
    </thead>
    <tbody>
      <tr><td>RAM</td><td>1.5–2 GB</td></tr>
      <tr><td>Disk</td><td>Set <code>IPFS_STORAGE_MAX</code> in your <code>.env</code></td></tr>
      <tr><td>CPU</td><td>Any (ARM64 / AMD64)</td></tr>
      <tr><td>Network</td><td>Port <code>4001</code> (TCP+UDP) open</td></tr>
    </tbody>
  </table>
</div>

<div class="card mb-md card-accent">
  <h2>Step-by-step</h2>
  <ol style="padding-left: 1.25rem; line-height: 2;">
    <li><strong>Install Docker</strong><br><code>curl -fsSL https://get.docker.com | sh</code></li>
    <li><strong>Clone the repo</strong><br><code>git clone https://github.com/rudyvdtas/ipfs-cluster-coordinator.git &amp;&amp; cd ipfs-cluster-coordinator</code></li>
    <li><strong>Configure</strong><br>
      <code>cp .env.example .env &amp;&amp; nano .env</code><br>
      <span class="text-muted text-sm">Set your <code>CLUSTER_PEERNAME</code> and <code>IPFS_STORAGE_MAX</code>. Use the secret I shared with you.</span>
    </li>
    <li><strong>Start</strong><br>
      <code>docker network create cluster-internal &amp;&amp; sudo ufw allow 4001/tcp 4001/udp &amp;&amp; docker compose up -d</code>
    </li>
  </ol>
</div>

<div class="card">
  <h2>How it works</h2>
  <p class="text-muted text-sm">
    The coordinator manages curated CIDs per project. When you join,
    the cluster assigns you a subset to host — automatically.
    Full guide:
    <a href="https://github.com/rudyvdtas/ipfs-cluster-coordinator/blob/main/volunteer_cluster.md" target="_blank" rel="noopener">
      volunteer_cluster.md →
    </a>
  </p>
</div>