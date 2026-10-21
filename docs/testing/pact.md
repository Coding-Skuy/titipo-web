# Uji kontrak konsumen (Pact) — titipo-web

Tiket TTP-WEB-TEST-PACT. titipo-web adalah konsumen; provider = `titipo-backend-service`.

- Spec: `contract/openapi.yaml` (salinan dari `titipo-backend-service/docs/api/openapi.yaml`). Tipe diturunkan: `bun run gen:api` -> `src/lib/api/schema.d.ts`.
- Klien: `src/lib/api/client.ts`. Uji: `tests/pact/admin.pact.test.ts` (PactV4, Vitest).
- Jalankan: `bun run test:pact`. Keluaran: `pacts/titipo-web-titipo-backend-service.json` (dikomit).
- Interaksi saat ini: `GET /admin/vendor`, `GET /admin/pesanan`, `GET /admin/katalog-cermin`, dan 403 untuk non-admin.
- Verifikasi sisi provider adalah pekerjaan backend (lihat issue di titipo-backend-service). Publikasi ke broker: `pact-broker publish pacts --consumer-app-version $(git rev-parse --short HEAD) --broker-base-url $PACT_BROKER_URL` dengan kredensial dari env CI; tidak ada kredensial di repo.
