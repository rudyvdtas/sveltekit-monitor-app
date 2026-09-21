<h1 style="margin-bottom: 0.25rem;">About Digital Art Rescue Lab</h1>
<p class="text-muted" style="margin-bottom: 1.5rem;">
  <a href="https://digitalartrescuelab.xyz" target="_blank" rel="noopener">digitalartrescuelab.xyz</a>
</p>

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