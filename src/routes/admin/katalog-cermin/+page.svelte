<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  const wib = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) + ' WIB';
</script>

<h1>Katalog cermin Lumbung</h1>

{#if data.banner}
  <p class="banner-merah" role="alert">
    Sinkron Lumbung gagal atau snapshot berumur lebih dari 24 jam. Snapshot terakhir tetap berlaku; mobile mengunci
    pesan bila umur lebih dari 24 jam.{#if data.galatJob} Galat: {data.galatJob}{/if}
  </p>
{/if}

{#if data.galat}
  <p class="galat">{data.galat}</p>
{:else if data.cermin}
  <table>
    <tbody>
      <tr><th>Diperbarui</th><td>{wib(data.cermin.diperbarui)}</td></tr>
      <tr><th>Sumber</th><td>{data.cermin.sumber}</td></tr>
      <tr><th>Jumlah SKU</th><td>{data.cermin.jumlah_sku}</td></tr>
      <tr><th>Status</th><td>{data.cermin.status}</td></tr>
      {#if data.versi}<tr><th>Snapshot lokal</th><td>{data.versi}</td></tr>{/if}
    </tbody>
  </table>
{/if}

<form method="POST" action="?/sinkron" use:enhance>
  <button type="submit">Sinkron ulang</button>
</form>
{#if form?.ok}<p>Sinkron dipicu, dicatat oleh {form.oleh}. Selesai maksimal 5 menit.</p>{/if}
{#if form?.galat}<p class="galat">{form.galat}</p>{/if}
