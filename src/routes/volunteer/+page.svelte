<script lang="ts">
  let data = $props() as { data: any };
  let volunteers = $derived(data.data.volunteers ?? 0);
  let cidCount = $derived(data.data.cidCount ?? 0);
  let peerCount = $derived(data.data.peerCount ?? 1);

  type Setup = 'docker' | 'existing-ipfs' | 'artbox' | 'faq' | 'about';
  let selected: Setup = $state('docker');
</script>

<h1 style="margin-bottom: 0.25rem;">Volunteer</h1>
<p class="text-muted" style="margin-bottom: 1.5rem;">
  {volunteers === 0 ? 'No volunteers yet — be the first!' : `${volunteers} active volunteer${volunteers > 1 ? 's' : ''}`}
  · {peerCount} peer{peerCount > 1 ? 's' : ''} · {cidCount} CIDs
</p>

<div class="tabs">
  <button class="tab" class:active={selected === 'docker'} onclick={() => selected = 'docker'}>
Full install
  </button>
  <button class="tab" class:active={selected === 'existing-ipfs'} onclick={() => selected = 'existing-ipfs'}>
    IPFS node + Cluster
  </button>
  <button class="tab" class:active={selected === 'artbox'} onclick={() => selected = 'artbox'}>
    Cluster + Artbox
  </button>
  <button class="tab" class:active={selected === 'faq'} onclick={() => selected = 'faq'}>
    FAQ
  </button>
  <button class="tab" class:active={selected === 'about'} onclick={() => selected = 'about'}>
    About
  </button>
</div>

{#if selected === 'docker'}
  <div class="card mb-md card-accent">
    <h2>Full install (Docker)</h2>
    <p class="text-muted text-sm">
      For a <strong>fresh machine</strong> without an existing IPFS node.
      This sets up Kubo + IPFS Cluster via Docker Compose, everything in one go.
    </p>
    <table>
      <thead>
        <tr><th>Item</th><th>Minimum</th></tr>
      </thead>
      <tbody>
        <tr><td>RAM</td><td>1.5–2 GB (idle ~500 MB–1 GB)</td></tr>
        <tr><td>Disk</td><td>Instelbaar via <code>IPFS_STORAGE_MAX</code> in <code>.env</code></td></tr>
        <tr><td>CPU</td><td>ARM64 / AMD64 (RPi 3/4/5, VPS, laptop)</td></tr>
        <tr><td>Network</td><td>Poort <code>4001</code> (TCP+UDP) open</td></tr>
        <tr><td>Software</td><td>Docker (<code>curl -fsSL https://get.docker.com | sh</code>)</td></tr>
      </tbody>
    </table>
    <p style="margin-top: 0.75rem;">
      <a href="https://github.com/rudyvdtas/ipfs-cluster-coordinator/blob/main/volunteer-docker.md" target="_blank" rel="noopener" class="primary button-like">
        Full guide → volunteer-docker.md
      </a>
    </p>
  </div>
{/if}

{#if selected === 'existing-ipfs'}
  <div class="card mb-md card-accent">
    <h2>IPFS node + Cluster</h2>
    <p class="text-muted text-sm">
      Voor wie al een <strong>bestaande Kubo node</strong> draait. Je voegt
      IPFS Cluster toe als systemd service die jouw Kubo API gebruikt.
      Jouw eigen pins blijven onaangetast via follower mode.
    </p>
    <pre><code>Jouw bestaande Kubo node (poort 5001)
└── IPFS Cluster (systemd service)
    ├── gebruikt jouw Kubo API
    ├── Cluster REST API: 9094
    └── Cluster gossip: 9096</code></pre>
    <table>
      <thead>
        <tr><th>Item</th><th>Detail</th></tr>
      </thead>
      <tbody>
        <tr><td>Extra RAM</td><td>~100 MB voor de cluster service</td></tr>
        <tr><td>Disk</td><td>Minstens 50 GB vrij voor cluster-CIDs</td></tr>
        <tr><td>Network</td><td>Poort <code>9096</code> (TCP) open naar de coordinator</td></tr>
        <tr><td>Software</td><td><code>ipfs-cluster-service</code> + <code>ipfs-cluster-ctl</code> binaries</td></tr>
      </tbody>
    </table>
    <p style="margin-top: 0.75rem;">
      <a href="https://github.com/rudyvdtas/ipfs-cluster-coordinator/blob/main/volunteer-existing-ipfs.md" target="_blank" rel="noopener" class="primary button-like">
        Full guide → volunteer-existing-ipfs.md
      </a>
    </p>
  </div>
{/if}

{#if selected === 'artbox'}
  <div class="card mb-md card-accent">
    <h2>Cluster + Artbox</h2>
    <p class="text-muted text-sm">
      Voor <strong>ArtBox-eigenaren</strong> (<a href="https://vernis.art/" target="_blank" rel="noopener">vernis.art</a>) met een bestaande ArtBox-Kubo.
      We voegen een <strong>tweede, aparte Kubo instance</strong> toe exclusief
      voor cluster-verkeer. Hierdoor blijven ArtBox-pins en cluster-CIDs
      volledig geïsoleerd.
    </p>
    <pre><code>ArtBox
├── ArtBox-Kubo (poort 5001) — eigen private CIDs
├── Cluster-Kubo (poort 5002) — cluster-CIDs alleen
└── IPFS Cluster — gebruikt Cluster-Kubo API</code></pre>
    <table>
      <thead>
        <tr><th>Item</th><th>Detail</th></tr>
      </thead>
      <tbody>
        <tr><td>Extra RAM</td><td>~300–500 MB (tweede Kubo + cluster)</td></tr>
        <tr><td>Disk</td><td>Minstens 50 GB vrij voor cluster-CIDs</td></tr>
        <tr><td>Network</td><td>Poorten <code>4002</code> en <code>9096</code> open</td></tr>
        <tr><td>Software</td><td><code>ipfs-cluster-service</code> + <code>ipfs-cluster-ctl</code> binaries</td></tr>
      </tbody>
    </table>
    <p style="margin-top: 0.75rem;">
      <a href="https://github.com/rudyvdtas/ipfs-cluster-coordinator/blob/main/volunteer-artbox.md" target="_blank" rel="noopener" class="primary button-like">
        Full guide → volunteer-artbox.md
      </a>
    </p>
  </div>
{/if}

{#if selected === 'faq'}
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
    <strong>Which setup should I choose?</strong>
  </p>
  <p class="text-muted text-sm" style="margin-top: 0;">
    <strong>Full install</strong> is best for a fresh machine (VPS, laptop)
    with Docker available. <strong>IPFS node + Cluster</strong> is for when you already
    run Kubo and want to add cluster support. <strong>Cluster + Artbox</strong> is
    specifically for ArtBox owners who need a second, isolated Kubo to keep
    their personal pinset separate from cluster-managed CIDs.
  </p>
</div>
{/if}

{#if selected === 'about'}
  <div class="card">
    <h2>About Digital Art Rescue Lab</h2>
    <p class="text-muted text-sm">
      <a href="https://digitalartrescuelab.xyz" target="_blank" rel="noopener">digitalartrescuelab.xyz</a>
    </p>
  </div>

  <div class="card">
    <h2>Preservation, pinning and redundancy</h2>
    <p class="text-muted text-sm">
      For IPFS-hosted artwork to remain reliably retrievable, at least one node
      or service must continue retaining and supplying its data. If the last
      available copy disappears, the CID may survive while the artwork file
      does not.
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      Platforms historically paid pinning services on behalf of artists and
      collectors. Many users therefore believed that minting on IPFS meant
      their artwork had been permanently stored. In reality, continued
      availability depended upon somebody maintaining the pinning arrangement.
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      When a platform closes, it may continue paying for pinning for a limited
      period, as Async and KnownOrigin appear to have done. When that
      arrangement ends, artwork may go dark unless another party has retrieved
      and pinned the underlying data.
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      MakersPlace has announced a different arrangement: it says Pinata has
      agreed to keep all MakersPlace NFT data pinned perpetually. It also moved
      high-resolution files from older contracts onto IPFS and worked with
      marketplaces to map affected tokens to those files. This makes
      MakersPlace less urgent as a rescue target.
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      Pinata is currently the most familiar pinning service within this
      community. It offers a relatively accessible way for individuals to
      create additional pins, but it remains a subscription-based commercial
      provider.
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      Multiple Pinata users pinning the same CID protects against the lapse of
      one individual subscription. It does not provide full provider-level
      redundancy. If all known copies depend upon the same company or
      infrastructure, the failure of that provider affects all of them.
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      Individuals can run IPFS nodes using equipment such as Raspberry Pis with
      attached storage and an always-on internet connection. AfroViking's device
      and Lou's prototype combine local IPFS storage with an artwork display.
      For preservation purposes, however, the display is optional and accounts
      for part of the cost. A simpler storage-and-serving node could be cheaper
      and accommodate larger drives.
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      The total storage requirement remains unknown and must be established
      before hardware or hosting can be costed reliably.
    </p>
  </div>

  <div class="card">
    <h3>Proposed distributed-node solution</h3>
    <p class="text-muted text-sm">
      To create true redundancy, DRL could establish a small network of
      independently controlled IPFS nodes operated by trusted stewards in
      different locations. (Currently code-named the Steward Swarm.)
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      A first-stage network might include five to seven nodes, although not
      every node would necessarily need to hold every corpus. The preservation
      plan could define which collections each node holds and ensure that every
      priority corpus exists in several independent places.
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      Networking the devices would allow them to coordinate what should be
      pinned and replace lost replicas more automatically. However, initial
      redundancy could also be established manually by supplying each steward
      with a verified list of required CIDs and checking that the files are
      retrievable from each node.
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      Each node would require suitable hardware and storage, reliable internet
      access, monitoring and maintenance support, contingency funding, and a
      named steward with a succession or return agreement.
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      If a steward can no longer maintain a node, responsibility and data should
      pass to another approved steward or return to DRL. Institutional partners
      such as libraries, museums, universities or digital archives could
      eventually provide an additional continuity layer, but no organisation
      should be named as a prospective custodian until it has agreed.
    </p>
    <p class="text-muted text-sm" style="margin-top: 0.75rem;">
      Remote servers, such as independently administered IPFS nodes hosted
      through Hetzner or another provider, could complement physical community
      nodes. They remain dependent on commercial data centres and should
      therefore form one part of a mixed system, not the entire solution.
    </p>
  </div>
{/if}

<style>
  a.button-like {
    display: inline-block;
    background: var(--accent);
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background 0.15s;
  }
  a.button-like:hover {
    background: var(--accent-dark);
    color: #fff;
  }
</style>