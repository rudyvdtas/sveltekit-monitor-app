<script lang="ts">
  let data = $props() as { data: any };
  let volunteers = $derived(data.data.volunteers ?? 0);
  let cidCount = $derived(data.data.cidCount ?? 0);
  let peerCount = $derived(data.data.peerCount ?? 1);

  type Setup = 'docker' | 'existing-ipfs' | 'artbox';
  let selected: Setup = $state('docker');
</script>

<h1 style="margin-bottom: 0.25rem;">Volunteer</h1>
<p class="text-muted" style="margin-bottom: 1.5rem;">
  {volunteers === 0 ? 'No volunteers yet — be the first!' : `${volunteers} active volunteer${volunteers > 1 ? 's' : ''}`}
  · {peerCount} peer{peerCount > 1 ? 's' : ''} · {cidCount} CIDs
</p>

<div class="tabs">
  <button class="tab" class:active={selected === 'docker'} onclick={() => selected = 'docker'}>
    Volledige installatie
  </button>
  <button class="tab" class:active={selected === 'existing-ipfs'} onclick={() => selected = 'existing-ipfs'}>
    IPFS node + Cluster
  </button>
  <button class="tab" class:active={selected === 'artbox'} onclick={() => selected = 'artbox'}>
    Cluster + Artbox
  </button>
</div>

{#if selected === 'docker'}
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
{/if}

{#if selected === 'existing-ipfs'}
  <div class="card mb-md card-accent">
    <h2>Architecture</h2>
    <p class="text-muted text-sm">
      You already run an IPFS node (Kubo). We add IPFS Cluster as a separate service
      that connects to your existing Kubo API. The cluster manages its allocations
      through your node — your existing pinset is safe because follower mode prevents
      the cluster from unpinning your personal CIDs.
    </p>
    <pre><code>Your existing IPFS node (Kubo)
└── API on port 5001 (or custom)
    └── IPFS Cluster (systemd service)
        ├── uses your Kubo API
        ├── Cluster API: 9094
        └── Cluster peer comms: 9096</code></pre>
  </div>

  <div class="card mb-md card-accent">
    <h2>Requirements</h2>
    <table>
      <thead>
        <tr><th>Item</th><th>Detail</th></tr>
      </thead>
      <tbody>
        <tr><td>Existing Kubo</td><td>A running Kubo instance (any setup — systemd, Docker, manual)</td></tr>
        <tr><td>RAM</td><td>Extra ~100 MB for the cluster service on top of your Kubo</td></tr>
        <tr><td>Disk</td><td>At least 50 GB free for cluster-allocated CIDs</td></tr>
        <tr><td>Network</td><td>Port <code>9096</code> (TCP) open to the coordinator</td></tr>
        <tr><td>Ports</td><td>Kubo API port must be reachable from the cluster service on the same machine</td></tr>
      </tbody>
    </table>
  </div>

  <div class="card mb-md card-accent">
    <h2>Step-by-step</h2>
    <ol style="padding-left: 1.25rem; line-height: 2.2;">
      <li>
        <strong>Get the cluster binaries</strong>
        <div class="text-muted text-sm">
          Download <code>ipfs-cluster-service</code> and <code>ipfs-cluster-ctl</code>.
          Use the same version as the coordinator (check with <code>docker exec cluster ipfs-cluster-service --version</code>).
        </div>
        <pre><code>CLUSTER_VERSION="1.1.6"
ARCH="linux-arm64"   # or linux-amd64

wget "https://dist.ipfs.tech/ipfs-cluster-service/v$CLUSTER_VERSION/ipfs-cluster-service_v$CLUSTER_VERSION_$ARCH.tar.gz"
tar -xzf "ipfs-cluster-service_v$CLUSTER_VERSION_$ARCH.tar.gz"
sudo cp ipfs-cluster-service/ipfs-cluster-service /usr/local/bin/
sudo cp ipfs-cluster-service/ipfs-cluster-ctl /usr/local/bin/
rm -rf ipfs-cluster-service *.tar.gz

ipfs-cluster-service --version</code></pre>
      </li>
      <li>
        <strong>Initialize the cluster config</strong>
        <pre><code>sudo mkdir -p /opt/ipfs-data/cluster
sudo chown -R $USER:$USER /opt/ipfs-data/cluster
export IPFS_CLUSTER_PATH=/opt/ipfs-data/cluster
ipfs-cluster-service init --consensus crdt</code></pre>
      </li>
      <li>
        <strong>Configure the cluster peer</strong>
        <div class="text-muted text-sm">
          Replace the placeholders with the values the coordinator shared with you.
        </div>
        <pre><code>export IPFS_CLUSTER_PATH=/opt/ipfs-data/cluster

CLUSTER_SECRET="&lt;the secret the coordinator shared with you&gt;"
COORDINATOR_PEER_ID="12D3KooWMRpaSMLHj3aoJqfxDMErRfu64HeHbwTttUynofsuBbzd"
CLUSTER_PEERNAME="my-machine-name"
COORDINATOR_IP="149.210.143.16"

ipfs-cluster-service config set secret "$CLUSTER_SECRET"
ipfs-cluster-service config set peername "$CLUSTER_PEERNAME"
ipfs-cluster-service config set follower_mode true

# Point to your existing Kubo API (change port if yours is different)
sed -i "s|/ip4/127.0.0.1/tcp/5001|/ip4/127.0.0.1/tcp/5001|" service.json

# Enable plain HTTP for the REST API
sed -i "s|/ip4/127.0.0.1/tcp/9094|/ip4/127.0.0.1/tcp/9094/http|" service.json

# Set bootstrap to the coordinator
ipfs-cluster-service config set cluster.bootstrap "[\"/ip4/$COORDINATOR_IP/tcp/9096/p2p/$COORDINATOR_PEER_ID\"]"</code></pre>
      </li>
      <li>
        <strong>Create the systemd service</strong>
        <pre><code>sudo tee /etc/systemd/system/ipfs-cluster.service &lt;&lt; 'EOF'
[Unit]
Description=IPFS Cluster peer
After=network.target

[Service]
Type=simple
User=$USER
Environment=IPFS_CLUSTER_PATH=/opt/ipfs-data/cluster
ExecStart=/usr/local/bin/ipfs-cluster-service daemon
Restart=always
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ipfs-cluster</code></pre>
      </li>
      <li>
        <strong>Open firewall &amp; start</strong>
        <div class="text-muted text-sm">
          Open port 9096 for cluster gossip, then start the service.
        </div>
        <pre><code>sudo ufw allow 9096/tcp
sudo systemctl start ipfs-cluster

# Follow the logs
sudo journalctl -u ipfs-cluster -f</code></pre>
      </li>
      <li>
        <strong>Verify your connection</strong>
        <pre><code>ipfs-cluster-ctl --host /ip4/127.0.0.1/tcp/9094 id
ipfs-cluster-ctl --host /ip4/127.0.0.1/tcp/9094 peers ls</code></pre>
        <div class="text-muted text-sm">
          You should see at least 2 peers: your own peer and the coordinator.
        </div>
      </li>
    </ol>
  </div>
{/if}

{#if selected === 'artbox'}
  <div class="card mb-md card-accent">
    <h2>Architecture</h2>
    <p class="text-muted text-sm">
      You have an <strong>ArtBox</strong> running with its own Kubo IPFS node.
      We add a second, separate Kubo instance exclusively for IPFS Cluster traffic.
      This keeps the ArtBox owner's personal pinset completely isolated from
      cluster-managed CIDs.
    </p>
    <pre><code>ArtBox Raspberry Pi
│
├── ipfs.service (ArtBox-Kubo)
│   └── owner's private CIDs (port 5001)
│
├── ipfs-cluster-ipfs.service (Cluster-Kubo)
│   └── cluster-managed CIDs only (port 5002)
│
└── ipfs-cluster.service
    └── uses Cluster-Kubo API (5002), gossip on 9096</code></pre>
    <p class="text-muted text-sm" style="margin-top: 0.5rem;">
      <strong>Why a separate Kubo?</strong> Kubo cannot tell the difference between
      an ArtBox pin and a Cluster pin. If the cluster rebalances, it could unpin
      CIDs that belong to the ArtBox owner. A separate Kubo guarantees isolation.
    </p>
  </div>

  <div class="card mb-md card-accent">
    <h2>Requirements</h2>
    <table>
      <thead>
        <tr><th>Item</th><th>Detail</th></tr>
      </thead>
      <tbody>
        <tr><td>ArtBox</td><td>A working ArtBox with systemd service <code>ipfs.service</code></td></tr>
        <tr><td>RAM</td><td>Extra ~300–500 MB for the second Kubo + cluster (RPi 4GB+ recommended)</td></tr>
        <tr><td>Disk</td><td>At least 50 GB free for cluster-allocated CIDs</td></tr>
        <tr><td>Network</td><td>Ports <code>4002</code> (second Kubo swarm) and <code>9096</code> (cluster gossip) open</td></tr>
        <tr><td>Software</td><td><code>ipfs-cluster-service</code>, <code>ipfs-cluster-ctl</code> binaries</td></tr>
      </tbody>
    </table>
  </div>

  <div class="card mb-md card-accent">
    <h2>Step-by-step</h2>
    <ol style="padding-left: 1.25rem; line-height: 2.2;">
      <li>
        <strong>Check the existing ArtBox-Kubo</strong>
        <pre><code>sudo systemctl status ipfs
sudo -u ipfs ipfs config Path</code></pre>
        <div class="text-muted text-sm">
          Confirm it runs and note the IPFS_PATH (typically <code>/opt/ipfs-data/ipfs</code>).
        </div>
      </li>
      <li>
        <strong>Install the Cluster-Kubo (second Kubo instance)</strong>
        <div class="text-muted text-sm">
          Use the same Kubo version as the ArtBox-Kubo for compatibility.
        </div>
        <pre><code>ARTBOX_KUBO_VERSION=$(/usr/local/bin/ipfs version | cut -d' ' -f3)
echo "$ARTBOX_KUBO_VERSION"

cd /tmp
wget "https://dist.ipfs.tech/kubo/$ARTBOX_KUBO_VERSION/kubo_&#123;$ARTBOX_KUBO_VERSION&#125;_linux-arm64.tar.gz"
tar -xzf "kubo_&#123;$ARTBOX_KUBO_VERSION&#125;_linux-arm64.tar.gz"
cd kubo
sudo bash install.sh
cd .. && rm -rf kubo kubo_*.tar.gz</code></pre>
      </li>
      <li>
        <strong>Initialize the Cluster-Kubo (separate repo)</strong>
        <pre><code>sudo -u ipfs mkdir -p /opt/ipfs-data/cluster-ipfs
sudo -u ipfs bash -c '
  export IPFS_PATH=/opt/ipfs-data/cluster-ipfs
  ipfs init --profile=lowpower
'</code></pre>
        <div class="text-muted text-sm">
          This creates a separate peer ID — normal and expected.
        </div>
      </li>
      <li>
        <strong>Configure the Cluster-Kubo</strong>
        <pre><code>sudo -u ipfs bash -c '
  export IPFS_PATH=/opt/ipfs-data/cluster-ipfs
  ipfs config Datastore.StorageMax "100GB"
  ipfs config Datastore.StorageGCWatermark 85
  ipfs config Datastore.GCPeriod "1h"
  ipfs config Routing.Type "dhtclient"
  ipfs config Reprovider.Interval "0"
  ipfs config Addresses.API "/ip4/127.0.0.1/tcp/5002"
  ipfs config Addresses.Gateway "/ip4/127.0.0.1/tcp/8081"
  ipfs config Addresses.Swarm "[\"/ip4/0.0.0.0/tcp/4002\", \"/ip6/::/tcp/4002\"]"
'</code></pre>
      </li>
      <li>
        <strong>Create the Cluster-Kubo systemd service</strong>
        <pre><code>sudo tee /etc/systemd/system/ipfs-cluster-ipfs.service &lt;&lt; 'EOF'
[Unit]
Description=IPFS daemon for Cluster
After=network.target

[Service]
Type=notify
User=ipfs
Group=ipfs
Environment=IPFS_PATH=/opt/ipfs-data/cluster-ipfs
ExecStart=/usr/local/bin/ipfs daemon --enable-gc
Restart=always
RestartSec=5
LimitNOFILE=65536
MemoryHigh=512M
MemoryMax=768M

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now ipfs-cluster-ipfs
curl http://127.0.0.1:5002/api/v0/version</code></pre>
      </li>
      <li>
        <strong>Install IPFS Cluster binaries</strong>
        <pre><code>CLUSTER_VERSION="1.1.6"

cd /tmp
wget "https://dist.ipfs.tech/ipfs-cluster-service/v$CLUSTER_VERSION/ipfs-cluster-service_v&#123;$CLUSTER_VERSION&#125;_linux-arm64.tar.gz"
tar -xzf "ipfs-cluster-service_v&#123;$CLUSTER_VERSION&#125;_linux-arm64.tar.gz"
sudo cp ipfs-cluster-service/ipfs-cluster-service /usr/local/bin/
sudo cp ipfs-cluster-service/ipfs-cluster-ctl /usr/local/bin/
rm -rf ipfs-cluster-service *.tar.gz

ipfs-cluster-service --version</code></pre>
      </li>
      <li>
        <strong>Initialize &amp; configure the cluster</strong>
        <pre><code>sudo mkdir -p /opt/ipfs-data/cluster
sudo chown -R ipfs:ipfs /opt/ipfs-data/cluster

sudo -u ipfs bash -c '
  export IPFS_CLUSTER_PATH=/opt/ipfs-data/cluster
  ipfs-cluster-service init --consensus crdt

  CLUSTER_SECRET="&lt;the secret the coordinator shared with you&gt;"
  COORDINATOR_PEER_ID="12D3KooWMRpaSMLHj3aoJqfxDMErRfu64HeHbwTttUynofsuBbzd"
  CLUSTER_PEERNAME="artbox-pi-jan"
  COORDINATOR_IP="149.210.143.16"

  ipfs-cluster-service config set secret "$CLUSTER_SECRET"
  ipfs-cluster-service config set peername "$CLUSTER_PEERNAME"
  ipfs-cluster-service config set follower_mode true

  # Point to Cluster-Kubo (port 5002), NOT the ArtBox-Kubo (5001)
  sed -i "s|/ip4/127.0.0.1/tcp/5001|/ip4/127.0.0.1/tcp/5002|" service.json
  sed -i "s|/ip4/127.0.0.1/tcp/9094|/ip4/127.0.0.1/tcp/9094/http|" service.json

  ipfs-cluster-service config set cluster.bootstrap "[\"/ip4/$COORDINATOR_IP/tcp/9096/p2p/$COORDINATOR_PEER_ID\"]"
'</code></pre>
      </li>
      <li>
        <strong>Create the cluster systemd service</strong>
        <pre><code>sudo tee /etc/systemd/system/ipfs-cluster.service &lt;&lt; 'EOF'
[Unit]
Description=IPFS Cluster peer
After=network.target ipfs-cluster-ipfs.service
BindsTo=ipfs-cluster-ipfs.service

[Service]
Type=simple
User=ipfs
Group=ipfs
Environment=IPFS_CLUSTER_PATH=/opt/ipfs-data/cluster
Environment=IPFS_PATH=/opt/ipfs-data/cluster-ipfs
ExecStart=/usr/local/bin/ipfs-cluster-service daemon
Restart=always
RestartSec=10
LimitNOFILE=65536
MemoryHigh=512M
MemoryMax=768M
ExecStartPre=/bin/sh -c '\
  for i in $(seq 1 30); do \
    curl -s http://127.0.0.1:5002/api/v0/version >/dev/null 2>&1 && exit 0; \
    echo "Waiting for Cluster-Kubo API..."; sleep 2; \
  done; \
  echo "Cluster-Kubo API not ready after 60s"; exit 1'

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ipfs-cluster</code></pre>
      </li>
      <li>
        <strong>Open firewall &amp; start</strong>
        <pre><code>sudo ufw allow 4002/tcp
sudo ufw allow 4002/udp
sudo ufw allow 9096/tcp
sudo ufw status verbose

sudo systemctl start ipfs-cluster
sudo journalctl -u ipfs-cluster -f</code></pre>
      </li>
      <li>
        <strong>Verify the setup</strong>
        <pre><code># Cluster peer ID
ipfs-cluster-ctl --host /ip4/127.0.0.1/tcp/9094 id

# Connected peers
ipfs-cluster-ctl --host /ip4/127.0.0.1/tcp/9094 peers ls

# All three services running
sudo systemctl status ipfs ipfs-cluster-ipfs ipfs-cluster</code></pre>
      </li>
      <li>
        <strong>Confirm isolation</strong>
        <div class="text-muted text-sm">
          ArtBox pins should never change due to cluster activity.
        </div>
        <pre><code># ArtBox pins
sudo -u ipfs env IPFS_PATH=/opt/ipfs-data/ipfs ipfs pin ls

# Cluster-Kubo identity (different peer ID from ArtBox)
sudo -u ipfs env IPFS_PATH=/opt/ipfs-data/cluster-ipfs ipfs id</code></pre>
      </li>
    </ol>
  </div>
{/if}

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
    are disabled at the protocol level. The curated CID list and the
    authoritative cluster pinset are controlled exclusively by the coordinator.
    CID allocation to peers is handled automatically by the cluster.
  </p>
  <p class="text-muted text-sm" style="margin-top: 0.75rem;">
    <code>CLUSTER_CRDT_TRUSTEDPEERS=*</code> is used on the coordinator to
    allow invited peers to participate in cluster synchronisation and receive
    status/metrics. This setting does <strong>not</strong> grant pinset-management
    authority — write access to the pinset is restricted to the coordinator
    via <code>trusted_peers</code> in the cluster config, and the shared
    <code>CLUSTER_SECRET</code> is still required to join the cluster at all.
    Volunteers do not receive coordinator-level control.
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
    Usually a firewall or port issue — check the firewall step for your setup,
    and verify that your hosting provider does not block the required ports at
    the network level (some VPS providers do this separately from <code>ufw</code>).
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
    Yes — via <code>docker exec cluster ipfs-cluster-ctl status</code> (Docker setup)
    or <code>ipfs-cluster-ctl --host /ip4/127.0.0.1/tcp/9094 status</code>
    (native setup).
  </p>

  <p class="text-sm" style="margin-top: 1rem; margin-bottom: 0.25rem;">
    <strong>Can volunteers add or remove CIDs?</strong>
  </p>
  <p class="text-muted text-sm" style="margin-top: 0;">
    No. The curated CID list and the authoritative cluster pinset are
    controlled exclusively by the coordinator. Volunteer peers run in follower
    mode, which disables local pin and unpin operations at the protocol level.
    <code>CLUSTER_CRDT_TRUSTEDPEERS=*</code> on the coordinator lets invited
    peers synchronise cluster state and report metrics, but does not grant
    pinset-management authority — only the coordinator can write to the
    pinset. Joining the cluster still requires the shared
    <code>CLUSTER_SECRET</code>, and volunteers do not receive
    coordinator-level control.
  </p>

  <p class="text-sm" style="margin-top: 1rem; margin-bottom: 0.25rem;">
    <strong>What if I am behind a home router or NAT?</strong>
  </p>
  <p class="text-muted text-sm" style="margin-top: 0;">
    Open port 9096 in your firewall and forward it from your router to your
    machine. Alternatively, install
    <a href="https://tailscale.com" target="_blank" rel="noopener">Tailscale</a>
    on both machines and set <code>CLUSTER_PEER_ADDRESSES</code> to your
    Tailscale IP in <code>.env</code>. This lets the coordinator reach back
    to your peer without opening any public ports.
  </p>

  <p class="text-sm" style="margin-top: 1rem; margin-bottom: 0.25rem;">
    <strong>Which setup should I choose?</strong>
  </p>
  <p class="text-muted text-sm" style="margin-top: 0;">
    <strong>Volledige installatie</strong> is best for a fresh machine (VPS, laptop)
    with Docker available. <strong>IPFS node + Cluster</strong> is for when you already
    run Kubo and want to add cluster support. <strong>Cluster + Artbox</strong> is
    specifically for ArtBox owners who need a second, isolated Kubo to keep
    their personal pinset separate from cluster-managed CIDs.
  </p>
</div>