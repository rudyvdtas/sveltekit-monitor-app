<script lang="ts">
  let data = $props() as { data: any };
  let volunteers = $derived(data.data.volunteers ?? 0);
  let cidCount = $derived(data.data.cidCount ?? 0);
  let peerCount = $derived(data.data.peerCount ?? 1);
</script>

<h1 style="margin-bottom: 0.25rem;">Volunteer</h1>
<p class="text-muted" style="margin-bottom: 1.5rem;">
  Help replicate curated content and strengthen the network.
  {volunteers === 0 ? 'No volunteers yet — be the first!' : `${volunteers} active volunteer${volunteers > 1 ? 's' : ''}`}
  · {peerCount} peer{peerCount > 1 ? 's' : ''} · {cidCount} CIDs
</p>

<div class="grid grid-3 mb-md">
  <div class="card card-accent">
    <h2>1. Get Docker</h2>
    <p class="text-muted text-sm" style="margin-bottom: 0.75rem;">Works on Linux, Raspberry Pi, any VPS (ARM64 or AMD64).</p>
    <pre><code>curl -fsSL https://get.docker.com | sh</code></pre>
  </div>
  <div class="card card-accent">
    <h2>2. Clone & Configure</h2>
    <p class="text-muted text-sm" style="margin-bottom: 0.75rem;">Get the coordinator repo and set your peer name + storage limit.</p>
    <pre><code>git clone https://github.com/rudyvdtas/ipfs-cluster-coordinator.git
cd ipfs-cluster-coordinator
cp .env.example .env</code></pre>
  </div>
  <div class="card card-accent">
    <h2>3. Start</h2>
    <p class="text-muted text-sm" style="margin-bottom: 0.75rem;">Create the network, open port 4001, and start the stack.</p>
    <pre><code>docker network create cluster-internal
sudo ufw allow 4001/tcp 4001/udp
docker compose up -d</code></pre>
  </div>
</div>

<div class="card mb-md">
  <h2>Requirements</h2>
  <table>
    <thead>
      <tr><th>Item</th><th>Minimum</th><th>Notes</th></tr>
    </thead>
    <tbody>
      <tr><td>RAM</td><td>1.5–2 GB</td><td>Kubo + Cluster together use ~500 MB–1 GB idle</td></tr>
      <tr><td>Disk</td><td>Configurable</td><td>Set <code>IPFS_STORAGE_MAX</code> in your <code>.env</code> (e.g. 200GB, 500GB)</td></tr>
      <tr><td>CPU</td><td>Any</td><td>Raspberry Pi 3/4/5 works great</td></tr>
      <tr><td>Network</td><td>Port 4001 (TCP+UDP)</td><td>For peer-to-peer content exchange. Open your firewall.</td></tr>
    </tbody>
  </table>
</div>

<div class="card">
  <h2>How it works</h2>
  <p class="text-muted text-sm" style="margin-bottom: 1rem;">
    The coordinator manages a curated list of CIDs grouped into projects.
    When you join as a volunteer peer, the cluster assigns you a subset of
    those CIDs to host — automatically. You don't need to choose anything.
    Each CID is stored on at least 2 peers for redundancy.
  </p>
  <p class="text-muted text-sm">
    Full step-by-step guide:
    <a href="https://github.com/rudyvdtas/ipfs-cluster-coordinator/blob/main/volunteer_cluster.md" target="_blank" rel="noopener">
      volunteer_cluster.md on GitHub →
    </a>
  </p>
</div>