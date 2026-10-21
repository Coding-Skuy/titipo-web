<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');
</script>

<h1>Fee ledger</h1>

<h2>Saldo vendor</h2>
<table>
  <thead><tr><th>Vendor</th><th>Saldo</th><th>Tunggakan denda</th></tr></thead>
  <tbody>
    {#each data.vendor as v}
      <tr><td>{v.id}</td><td>{rp(v.saldo)}</td><td>{rp(v.tunggakan)}</td></tr>
    {:else}
      <tr><td colspan="3">Belum ada pencairan.</td></tr>
    {/each}
  </tbody>
</table>

<h2>Cair manual</h2>
<p>Pencairan H-1 ({data.tanggal}): {data.statusH1 ?? 'belum dijalankan'}. Gunakan hanya bila job 00.00 dan 01.00 gagal.</p>
<form method="POST" action="?/cairManual" use:enhance>
  <label>Tanggal <input name="tanggal" value={data.tanggal} /></label>
  <label>Aktor <input name="aktor" required placeholder="admin@titipo.id" /></label>
  <button type="submit">Cair manual</button>
</form>
{#if form?.ok}<p>Dicairkan {form.dicairkan} pesanan, dilewati {form.dilewati}.</p>{/if}
{#if form?.galat}<p class="galat">{form.galat}</p>{/if}

<h2>Ledger terakhir</h2>
<table>
  <thead><tr><th>#</th><th>Waktu</th><th>Vendor</th><th>Jenis</th><th>Kode</th><th>Delta</th><th>Saldo</th></tr></thead>
  <tbody>
    {#each data.baris as b}
      <tr><td>{b.seq}</td><td>{b.waktu}</td><td>{b.id_vendor}</td><td>{b.jenis}</td><td>{b.kode ?? ''}</td><td>{rp(b.delta)}</td><td>{rp(b.saldo_setelah)}</td></tr>
    {/each}
  </tbody>
</table>

<h2>Berita acara rekonsiliasi (Senin 09.00)</h2>
<ul>
  {#each data.pekan as p}
    <li><a href="/admin/fee/rekonsiliasi.csv?pekan={p}" data-sveltekit-reload>Pekan {p} (CSV)</a></li>
  {:else}
    <li>Belum ada berita acara.</li>
  {/each}
</ul>
