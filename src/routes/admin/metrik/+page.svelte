<script lang="ts">
  let { data } = $props();
  const pct = (n: number | null, d = 1) => (n === null ? '-' : n.toFixed(d) + '%');
  const warna = { hijau: '#15803d', merah: '#b91c1c', kosong: '#6b7280' } as const;
</script>

<h1>Metrik</h1>

{#if !data.tersedia}
  <p class="galat">Sumber data metrik belum terpasang. Admin API belum memuat data rumah tangga, waktu serah, dan rating; dashboard terisi setelah adapter data tersedia.</p>
{:else if data.galat}
  <p class="galat">{data.galat}</p>
{:else if data.kota && data.pendamping && data.lampu}
  <h2>Repeat order 28 hari bergulir</h2>
  <p style="color:{warna[data.kota.lampu]}">
    Kota: <strong>{data.kota.nilai === null ? '-' : (data.kota.nilai * 100).toFixed(1) + '%'}</strong> (target 35%)
  </p>
  <table>
    <thead><tr><th>Vendor Prioritas</th><th>Repeat</th><th>Target</th></tr></thead>
    <tbody>
      {#each data.perVendor as v}
        <tr style="color:{warna[v.lampu]}"><td>{v.id}</td><td>{v.repeat === null ? '-' : (v.repeat * 100).toFixed(1) + '%'}</td><td>40%</td></tr>
      {:else}
        <tr><td colspan="3">Tidak ada vendor Prioritas.</td></tr>
      {/each}
    </tbody>
  </table>

  <h2>Metrik pendamping</h2>
  <table>
    <thead><tr><th>Metrik</th><th>Nilai</th><th>Ambang</th></tr></thead>
    <tbody>
      <tr style="color:{warna[data.lampu.tepatSerah]}"><td>Tepat serah (+-15 menit)</td><td>{pct(data.pendamping.tepatSerah)}</td><td>&ge; 95%</td></tr>
      <tr style="color:{warna[data.lampu.batalVendor]}"><td>Batal vendor</td><td>{pct(data.pendamping.batalVendor)}</td><td>&le; 2%</td></tr>
      <tr style="color:{warna[data.lampu.rating30]}"><td>Rating 30 hari</td><td>{data.pendamping.rating30 === null ? '-' : data.pendamping.rating30.toFixed(2)}</td><td>&ge; 4,5</td></tr>
      <tr style="color:{warna[data.lampu.medianKonfirmasi]}"><td>Median konfirmasi</td><td>{data.pendamping.medianKonfirmasi === null ? '-' : data.pendamping.medianKonfirmasi.toFixed(0) + ' menit'}</td><td>&le; 20 menit</td></tr>
    </tbody>
  </table>

  <h2>Usul Prioritas</h2>
  {#if data.usulan.length}
    <p>Memenuhi repeat &ge; 40% selama 4 minggu dan rating &ge; 4,7. Admin tinggal menyetujui di <a href="/admin/vendor?status=aktif">/admin/vendor</a>.</p>
    <ul>{#each data.usulan as id}<li>{id}</li>{/each}</ul>
  {:else}
    <p>Belum ada vendor yang memenuhi syarat.</p>
  {/if}
{/if}
