<script lang="ts">
  let { children } = $props();
  const menu = [
    { href: '/admin/vendor', teks: 'Vendor' },
    { href: '/admin/katalog-cermin', teks: 'Katalog cermin' },
    { href: '/admin/fee', teks: 'Fee ledger' },
    { href: '/admin/metrik', teks: 'Metrik' }
  ];
</script>

<nav class="bar">
  <a href="/" class="merek">TitipO Admin</a>
  {#each menu as m}
    <a href={m.href}>{m.teks}</a>
  {/each}
</nav>
<main>{@render children()}</main>

<style>
  :global(body) {
    font-family: system-ui, sans-serif;
    margin: 0;
    color: #1a1a1a;
  }
  .bar {
    display: flex;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: #14532d;
    flex-wrap: wrap;
  }
  .bar a {
    color: #fff;
    text-decoration: none;
  }
  .merek {
    font-weight: 700;
  }
  main {
    padding: 1rem;
    max-width: 960px;
    margin: 0 auto;
  }
  :global(table) {
    border-collapse: collapse;
    width: 100%;
  }
  :global(th), :global(td) {
    border-bottom: 1px solid #ddd;
    padding: 0.4rem;
    text-align: left;
  }
  :global(.banner-merah) {
    background: #b91c1c;
    color: #fff;
    padding: 0.75rem 1rem;
    border-radius: 4px;
  }
  :global(.galat) {
    color: #b91c1c;
  }
</style>
