<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<nav class="navbar">
  <div class="nav-inner">
    <a href="/" class="logo">IPFS Cluster</a>
    <div class="nav-links">
      <a href="/">Overview</a>
      <a href="/pins">Pins</a>
    </div>
  </div>
</nav>

<main class="main">
  {@render children()}
</main>

<style>
  .navbar {
    border-bottom: 1px solid var(--border);
    background: var(--bg-card);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 48px;
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .logo {
    font-weight: 700;
    font-size: 1rem;
    color: var(--text);
    letter-spacing: -0.02em;
  }

  .nav-links { display: flex; gap: 1.5rem; }

  .nav-links a {
    font-size: 0.875rem;
    color: var(--text-muted);
    padding: 0.25rem 0;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
  }

  .nav-links a:hover { color: var(--text); }

  .nav-links a[aria-current='page'] {
    color: var(--text);
    border-bottom-color: var(--accent);
  }

  .main { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
</style>