# Uji properti Schemathesis — titipo-web

Tiket TTP-WEB-TEST-SCHEMATHESIS. Menguji `contract/openapi.yaml` (salinan spec titipo-backend-service) secara berbasis properti: skema respons, kode status terdokumentasi, validasi input.

## Pakai
```bash
python3 -m venv .venv && .venv/bin/pip install schemathesis
# Tanpa backend: mock Prism dari spec (butuh bun; hanya menguji konsistensi spec/mock)
SCHEMATHESIS=.venv/bin/schemathesis MOCK=1 ./contract/schemathesis.sh
# Terhadap server nyata (hanya GET; tambah INCLUDE_WRITES=1 untuk POST pada server uji)
BASE_URL=https://staging.example AUTH_TOKEN=<jwt-admin> ./contract/schemathesis.sh
```
Variabel: `BASE_URL`, `MOCK`, `SPEC`, `AUTH_TOKEN`, `MAX_EXAMPLES`, `INCLUDE_WRITES`, `SCHEMATHESIS`. CI: workflow manual `.github/workflows/schemathesis.yml` (`workflow_dispatch`). Telemetri dimatikan (`E2E_TELEMETRY_DISABLED=1`); tidak ada data dikirim keluar.

## Hasil lari lokal 2026-10-21 (schemathesis 4.32.2, mock Prism 5.16.0, GET saja)
6 operasi diuji, 156 kasus; fase Examples lulus; 3 temuan:
- `GET /admin/vendor?status=<tak-valid>` dan `GET /admin/pesanan?status=<tak-valid>` mengembalikan 422, tetapi spec tidak mendokumentasikan 400/422 (ST103). Temuan pada spec: dilaporkan sebagai issue di titipo-backend-service.
- `GET /admin/vendor?status=` (string kosong) diterima 200 (ST201); perilaku mock, perlu ditegaskan di provider nyata.
Check `ignored_auth` dan `unsupported_method` dimatikan hanya pada `MOCK=1` karena Prism tidak menegakkan auth atau header `Allow`.
Skrip keluar dengan kode non-nol selama temuan belum diperbaiki di spec.
