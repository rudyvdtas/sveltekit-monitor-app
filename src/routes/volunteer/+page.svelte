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
      <tr><td>RAM</td><td>1.5–2 GB (idle ~500 MB–1 GB)</td></tr>
      <tr><td>Disk</td><td>Configurable — set <code>IPFS_STORAGE_MAX</code> in your <code>.env</code></td></tr>
      <tr><td>CPU</td><td>Any (ARM64 / AMD64 — RPi 3/4/5 works)</td></tr>
      <tr><td>Network</td><td>Port <code>4001</code> (TCP+UDP) open in your firewall</td></tr>
      <tr><td>Software</td><td>Docker (<code>curl -fsSL https://get.docker.com | sh</code>)</td></tr>
    </tbody>
  </table>
</div>

<div class="card mb-md card-accent">
  <h2>Step-by-step</h2>
  <ol style="padding-left: 1.25rem; line-height: 2.2;">
    <li>
      <strong>Install Docker</strong>
      <div class="text-muted text-sm">
        <strong>Linux / VPS / Raspberry Pi (production):</strong>
        <pre><code>curl -fsSL https://get.docker.com | sh</code></pre>
        <strong>macOS (testing only):</strong>
        Docker Desktop via <code>brew install --cask docker</code>,
        or <a href="https://docs.docker.com/desktop/setup/install/mac-install/" target="_blank" rel="noopener">download from docker.com</a>.
        Note: macOS peers are not reachable from the public internet.
      </div>
    </li>
    <li>
      <strong>Clone the coordinator repository</strong>
      <div class="text-muted text-sm">All configuration files and scripts are in this repo.</div>
      <pre><code>git clone https://github.com/rudyvdtas/ipfs-cluster-coordinator.git
cd ipfs-cluster-coordinator</code></pre>
    </li>
    <li>
      <strong>Configure your peer</strong>
      <div class="text-muted text-sm">Create your config file and fill in the values below.</div>
      <pre><code>cp .env.example .env
nano .env</code></pre>
      <div class="text-muted text-sm" style="margin-top: 0.25rem;">
        Fill in the following fields (example):
      </div>
      <pre><code>CLUSTER_SECRET=&lt;the secret the coordinator shared with you&gt;
CLUSTER_PEERNAME=choose-a-unique-name
COORDINATOR_PEER_ID=12D3KooWMRpaSMLHj3aoJqfxDMErRfu64HeHbwTttUynofsuBbzd
CLUSTER_FOLLOWERMODE=true
IPFS_STORAGE_MAX=200GB
BOOTSTRAP_PEERS=/ip4/149.210.143.16/tcp/9096/p2p/12D3KooWMRpaSMLHj3aoJqfxDMErRfu64HeHbwTttUynofsuBbzd
# Only needed behind NAT — set to your public or Tailscale IP:
# CLUSTER_PEER_ADDRESSES=/ip4/&lt;your-public-or-tailscale-ip&gt;/tcp/9096</code></pre>
      <div class="text-muted text-sm" style="margin-top: 0.25rem;">
        <strong>Contact us</strong> if you want to participate so we can share
        the needed <code>CLUSTER_SECRET</code> and bootstrap address.
      </div>
    </li>
    <li>
      <strong>Open your firewall (Linux/VPS only)</strong>
      <div class="text-muted text-sm">Your node communicates with other peers on port 4001.</div>
      <pre><code>sudo ufw allow 4001/tcp
sudo ufw allow 4001/udp</code></pre>
      <div class="text-muted text-sm">
        If you use a cloud provider (Hetzner, TransIP, etc.), also open port 4001
        in their separate firewall panel.
      </div>
      <div class="text-muted text-sm" style="margin-top: 0.5rem;">
        <strong>Behind NAT (home network, Docker Desktop on macOS)?</strong>
        Also allow port 9096 and forward it from your router:
      </div>
      <pre><code>sudo ufw allow 9096/tcp</code></pre>
      <div class="text-muted text-sm">
        Without this, the coordinator cannot reach back to your peer for CRDT sync
        and metrics. If your machine has a public IP, also set
        <code>CLUSTER_PEER_ADDRESSES</code> in <code>.env</code> (see step 3).<br>
        <strong>macOS:</strong> Skip firewall steps — not required for testing.
      </div>
    </li>
    <li>
      <strong>Create the Docker network &amp; start</strong>
      <div class="text-muted text-sm">This establishes the internal network the cluster uses.</div>
      <pre><code>docker network create cluster-internal
docker compose up -d</code></pre>
    </li>
    <li>
      <strong>Verify your connection</strong>
      <div class="text-muted text-sm">Wait 30 seconds, then run:</div>
      <pre><code>docker exec cluster ipfs-cluster-ctl id</code></pre>
      <div class="text-muted text-sm">
        If you see a valid peer ID (e.g. <code>12D3...</code>) and no errors,
        your node is connected and visible to the coordinator.
      </div>
    </li>
  </ol>
</div>

<div class="card">
  <h2>Trust model</h2>
  <p class="text-muted text-sm">
    Volunteers join after the coordinator shares the cluster secret and bootstrap
    address — there is no open sign-up. The secret is the access gate.
  </p>
  <p class="text-muted text-sm" style="margin-top: 0.75rem;">
    Your peer runs in <strong>follower mode</strong>
    (<code>CLUSTER_FOLLOWERMODE=true</code>), which means you can join the
    cluster, receive allocations, and host content, but pin and unpin operations
    are disabled at the protocol level. Only the coordinator can manage the
    pinset. CID allocation is handled automatically by the cluster.
  </p>
</div>

<div class="card">
  <h2>What happens after you join</h2>
  <p class="text-muted text-sm">
    Once your peer is visible in the cluster, the coordinator increases
    the replication factor so curated CIDs are distributed across your
    machine and the coordinator. CIDs are assigned based on which ones
    currently have the fewest replicas, so new volunteers immediately improve
    overall redundancy. From that point on, each CID is stored on at least
    2 peers — the goal of the network is redundancy.
  </p>
  <p class="text-muted text-sm" style="margin-top: 0.75rem;">
    Your node automatically receives the assigned CIDs. You don't need to
    choose or manage anything. All content is verified and hosted by your
    IPFS node.
  </p>
  <p class="text-muted text-sm" style="margin-top: 0.75rem;">
    Check the status of all CIDs:
    <br>
    <code>docker exec cluster ipfs-cluster-ctl status</code>
  </p>
  <p class="text-muted text-sm" style="margin-top: 0.75rem;">
    The long-term goal is <strong>5 independent replicas per CID</strong>:
    as more volunteers join, the replication factor increases so that each
    artwork is stored on at least 5 different nodes.
  </p>
</div>

<div class="card">
  <h2>Frequently asked questions</h2>

  <p class="text-sm" style="margin-bottom: 0.25rem;">
    <strong>I get an error with <code>docker compose up -d</code>.</strong>
  </p>
  <p class="text-muted text-sm" style="margin-top: 0;">
    Check that Docker is running (<code>docker ps</code> should work) and that
    you are in the correct directory (<code>ipfs-cluster-coordinator</code>).
  </p>

  <p class="text-sm" style="margin-top: 1rem; margin-bottom: 0.25rem;">
    <strong><code>ipfs-cluster-ctl id</code> gives no output or hangs.</strong>
  </p>
  <p class="text-muted text-sm" style="margin-top: 0;">
    Usually a firewall or port issue — check step 4, and verify that your
    hosting provider does not block port 4001 at the network level (some VPS
    providers do this separately from <code>ufw</code>).
  </p>

  <p class="text-sm" style="margin-top: 1rem; margin-bottom: 0.25rem;">
    <strong>How much data traffic should I expect?</strong>
  </p>
  <p class="text-muted text-sm" style="margin-top: 0;">
    That depends on how much you contribute via <code>IPFS_STORAGE_MAX</code>
    and how often content is requested by others. Start with a smaller amount
    if you are unsure.
  </p>

  <p class="text-sm" style="margin-top: 1rem; margin-bottom: 0.25rem;">
    <strong>Can I see which CIDs I am hosting?</strong>
  </p>
  <p class="text-muted text-sm" style="margin-top: 0;">
    Yes, via <code>docker exec cluster ipfs-cluster-ctl status</code>
    (same command from step 6).
  </p>

  <p class="text-sm" style="margin-top: 1rem; margin-bottom: 0.25rem;">
    <strong>Can volunteers add or remove CIDs?</strong>
  </p>
  <p class="text-muted text-sm" style="margin-top: 0;">
    No. Volunteer peers run in follower mode, which disables local pin and
    unpin operations. The coordinator is the only peer allowed to manage
    the pinset. The cluster handles all allocation automatically via
    the curated CID list.
  </p>

  <p class="text-sm" style="margin-top: 1rem; margin-bottom: 0.25rem;">
    <strong>What if I am behind a home router or NAT?</strong>
  </p>
  <p class="text-muted text-sm" style="margin-top: 0;">
    Open port 9096 in your firewall and forward it from your router to your
    machine (see step 4). Alternatively, install
    <a href="https://tailscale.com" target="_blank" rel="noopener">Tailscale</a>
    on both machines and set <code>CLUSTER_PEER_ADDRESSES</code> to your
    Tailscale IP in <code>.env</code>. This lets the coordinator reach back
    to your peer without opening any public ports.
  </p>
</div>