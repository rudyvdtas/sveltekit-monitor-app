<script lang="ts">
  import '../app.css';
  import drlLogo from '$lib/assets/DRL_navbar_logo.svg';
  let { children } = $props();
  let menuOpen = $state(false);
</script>

<nav class="navbar">
  <div class="nav-inner">
    <a href="/" class="logo"><img src={drlLogo} alt="DRL" class="logo-img" /></a>
    <button class="hamburger" onclick={() => (menuOpen = !menuOpen)} aria-label="Menu" class:hamburger-open={menuOpen}>
      <span></span><span></span><span></span>
    </button>
    <div class="nav-links" class:open={menuOpen}>
      <a href="/">Dashboard</a>
      <a href="/projects">Projects</a>
      <a href="/info">Info</a>
      <a href="/about">About</a>
    </div>
  </div>
</nav>

<main class="main">
  {@render children()}
</main>

<style>
  .navbar {
    border-bottom: 1px solid var(--border);
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 56px;
    display: flex;
    align-items: center;
    gap: 2.5rem;
  }

  .logo {
    display: flex;
    align-items: center;
    text-decoration: none;
  }
  .logo-img {
    height: 2rem;
    width: auto;
    object-fit: contain;
  }

  .nav-links { display: flex; gap: 1.75rem; }

  .nav-links a {
    font-size: 0.95rem;
    color: var(--text-muted);
    padding: 0.3rem 0;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
  }

  .nav-links a:hover { color: var(--accent); }

  .nav-links a[aria-current='page'] {
    color: var(--accent-dark);
    border-bottom-color: var(--accent);
  }

  .hamburger {
    display: none;
    background: none;
    border: none;
    padding: 0.35rem;
    cursor: pointer;
    flex-shrink: 0;
    margin-left: auto;
  }
  .hamburger span {
    display: block;
    width: 22px;
    height: 3px;
    background: var(--text);
    border-radius: 2px;
    margin: 3px 0;
    transition: all 0.2s;
  }
  .hamburger-open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
  .hamburger-open span:nth-child(2) { opacity: 0; }
  .hamburger-open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

  .main { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }

  @media (max-width: 640px) {
    .nav-inner { padding: 0 1rem; position: relative; }
    .hamburger { display: block; }
    .nav-links {
      display: none;
      position: absolute;
      top: 56px;
      left: 0;
      right: 0;
      flex-direction: column;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 0.5rem 1rem;
      gap: 0;
      z-index: 20;
    }
    .nav-links.open { display: flex; }
    .nav-links a {
      display: block;
      padding: 0.6rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    .nav-links a:last-child { border-bottom: none; }
  }
</style>