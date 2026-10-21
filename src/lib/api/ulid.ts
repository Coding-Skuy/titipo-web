const ABJAD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** ULID 26 karakter (pola `^[0-9A-HJKMNP-TV-Z]{26}$`) untuk header Idempotency-Key. */
export function buatUlid(sekarang: number = Date.now(), acak: () => number = Math.random): string {
  let waktu = '';
  let t = sekarang;
  for (let i = 0; i < 10; i++) {
    waktu = ABJAD[t % 32] + waktu;
    t = Math.floor(t / 32);
  }
  let rand = '';
  for (let i = 0; i < 16; i++) rand += ABJAD[Math.floor(acak() * 32) % 32];
  return waktu + rand;
}
