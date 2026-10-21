<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  const ikon = { lolos: 'ya', gagal: 'tidak', tidak_diketahui: '?' } as const;
</script>

<h1>Vendor</h1>

<nav aria-label="Filter status">
  {#each data.semuaStatus as s}
    <a href="?status={s}" aria-current={s === data.status ? 'page' : undefined}>{s}</a>{' '}
  {/each}
</nav>

{#if data.galat}<p class="galat">{data.galat}</p>{/if}
{#if form?.galat}<p class="galat" role="alert">{form.id}: {form.galat}</p>{/if}
{#if form?.pesan}<p role="status">{form.pesan} Dicatat oleh {form.dicatat_oleh}.</p>{/if}
{#if form?.peringatan}<p class="galat" role="alert">{form.peringatan}</p>{/if}

{#each data.vendor as v (v.id)}
  <section>
    <h2>{v.nama} <small>({v.id}, {v.status})</small></h2>
    <p>Skor kebersihan: {v.skor_kebersihan ?? 'tidak ada'} {#if v.skor_kebersihan !== undefined}({v.lolos ? 'lolos' : 'tidak lolos'}, minimal 80){/if}</p>
    <ul>
      {#each v.syarat as s}<li>[{ikon[s.status]}] {s.label}</li>{/each}
    </ul>
    <p>Dokumen: {(v.dokumen ?? []).join(', ') || 'tidak ada'}</p>

    {#if v.status === 'calon'}
      <form method="POST" action="?/verifikasi" use:enhance>
        <input type="hidden" name="id" value={v.id} />
        <input type="hidden" name="skor_kebersihan" value={v.skor_kebersihan ?? ''} />
        <button name="setuju" value="true" type="submit" disabled={v.skor_kebersihan !== undefined && !v.lolos}>Setujui (aktif, kuota 30)</button>
        <input name="alasan" placeholder="Alasan penolakan" />
        <button name="setuju" value="false" type="submit">Tolak</button>
      </form>
    {/if}

    {#if v.status === 'aktif' || v.status === 'prioritas'}
      <form method="POST" action="?/skors" use:enhance>
        <input type="hidden" name="id" value={v.id} />
        <select name="hari"><option value="3">3 hari</option><option value="7">7 hari</option></select>
        <input name="alasan" placeholder="Alasan skors" required />
        <button type="submit">Skors</button>
      </form>
    {/if}
  </section>
{:else}
  {#if !data.galat}<p>Tidak ada vendor berstatus {data.status}.</p>{/if}
{/each}

{#if data.lanjut}<a href="?status={data.status}&lanjut={encodeURIComponent(data.lanjut)}">Berikutnya</a>{/if}
