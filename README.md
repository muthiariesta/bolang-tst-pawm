# Bolang

Bolang (bocah petualang) adalah aplikasi perencana jalan-jalan beberapa hari di Bandung Raya. Pengguna memilih tempat, tanggal, dan titik awal, lalu Bolang menyusun urutan kunjungan per hari beserta waktu tempuh, jam buka, dan prakiraan cuaca.

Di ekosistem Jelajah Nusantara, layanan di balik Bolang bernama **Jelajah Rute**.

| | |
|---|---|
| Kelas | II3160 TST × II3140 PWAM, K01 |
| Tim | Muthia Ariesta Anggraeni (18224045, Backend TST) · Benedicta Sherin Chyntia Putri (18224065, Mobile PWAM) |
| URL layanan | `https://bertigasamatitut.stei.fun/api` |
| Dokumentasi API | Swagger `https://bertigasamatitut.stei.fun/api/docs` · OpenAPI `https://bertigasamatitut.stei.fun/api/openapi.json` |
| Cek layanan | `GET https://bertigasamatitut.stei.fun/api/health` |
| Akun demo | `demo@bolang.id` / `bolang2026` (peran user) |

## Isi repositori

| Folder | Isi | Mata kuliah |
|---|---|---|
| [`backend/`](backend/) | Microservice yang berjalan di STB dengan Docker | TST |
| [`mobile/`](mobile/) | Aplikasi React Native (Expo) | PWAM |
| [`docs/`](docs/) | Diagram dan kontrak API | Keduanya |

Petunjuk lengkap ada di README masing-masing folder.
