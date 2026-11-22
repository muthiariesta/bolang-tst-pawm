# Bolang · Aplikasi Mobile (PWAM)

Aplikasi mobile Bolang untuk microservice **Jelajah Rute** di ekosistem Jelajah Nusantara. Fungsinya menyusun itinerary wisata N hari di Bandung Raya dengan memperhitungkan jarak, waktu tempuh, jam buka, dan cuaca. Dibangun dengan React Native + Expo dan mengikuti struktur materi praktikum II3140 (KatalogKu, Modul 1–10).

| | |
|---|---|
| Kelas | II3160 TST × II3140 PWAM, K01 |
| Tim | Muthia Ariesta Anggraeni (18224045, Backend TST) · Benedicta Sherin Chyntia Putri (18224065, Mobile PWAM) |
| Tech stack | Expo SDK 58 · React Native · React Navigation 7 (native-stack + bottom-tabs) · Context API · Jest + React Native Testing Library |
| Backend | `https://bertigasamatitut.stei.fun/api` (lihat [backend/README.md](../backend/README.md)) |
| Desain | [Figma: TSTxPAWM](https://www.figma.com/design/SylhCAFnEDlnvJbvZssuuE/TSTxPAWM) (halaman HiFi: Design System, Components, 16 layar) |
| Package | `id.ac.itb.s18224065.bolang` |
| Versi | 1.0.0 |

Dokumen ini membahas aplikasi di folder `mobile/`. Gambaran proyek secara utuh ada di [README utama](../README.md), dan microservice yang dipanggil aplikasi ada di [backend/README.md](../backend/README.md).

## 1. Arsitektur

```
 HP (Expo Go / APK)                         Server
┌───────────────────────────┐   HTTPS   ┌──────────────────────────────────────┐
│ screens/  ←  components/  │──────────▶│ Jelajah Rute (STB, Cloudflare Tunnel)│
│     │          theme/     │           │ /places /itineraries /templates      │
│ context/ (Auth, Plan)     │           │ /weather /route/estimate /auth       │
│     │                     │   HTTPS   ├──────────────────────────────────────┤
│ services/ApiService.js ───┼──────────▶│ Orkestrasi Rencana (di luar STB)     │
│     └─ mockApi.js (dummy) │           │ kisah & acara → Kisah & Kalender Budaya│
└───────────────────────────┘           │ kuliner → Xplor Bandung · model bahasa │
                                        └──────────────────────────────────────┘
```

- Semua panggilan server lewat **satu file**, `src/services/ApiService.js`. Tidak ada URL API di file screen.
- Layanan inti tidak pernah memanggil layanan tim lain. Kisah, acara, dan kuliner diambil dari **Orkestrasi Rencana**, dan setiap bagiannya dimuat terpisah. Jika satu layanan mati, hanya bagian itu yang menampilkan pesan "belum tersedia".
- **Mode dummy** (`EXPO_PUBLIC_USE_DUMMY=true`) mengganti server dengan `mockApi.js`. Bentuk respons dan aturan penjadwalannya sama, jadi aplikasi bisa didemokan tanpa STB.

Struktur folder (mengikuti slide "Struktur Folder Akhir"):

```
mobile/
├── App.js                 Provider (SafeArea, Auth, Plan) + font + AppNavigator
├── index.js               registerRootComponent
├── app.json               nama, ikon, splash, package (M2, M9)
├── eas.json               profil build APK + URL API https (M9, M10)
├── .env.example           EXPO_PUBLIC_API_URL, EXPO_PUBLIC_ORCHESTRATOR_URL, EXPO_PUBLIC_USE_DUMMY
├── assets/                ikon, adaptive icon, splash, ilustrasi @1x/@2x/@3x, foto tempat
├── __tests__/             7 file unit test (M8)
└── src/
    ├── theme/             colors, typography, spacing, layout (token Figma)
    ├── components/        40 komponen reusable (M3, M4)
    ├── screens/           15 layar (M4–M7)
    ├── navigation/        AppNavigator (Stack + Tab), routes (M5)
    ├── context/           AuthContext, PlanContext (M6, M7)
    ├── hooks/             useForm, useApi, useResponsive (M6)
    ├── utils/             validators, format, openingHours, itinerary, geo, ajaib (M6)
    ├── services/          ApiService, errors, storage, mockApi (M7)
    └── data/              categories, constants, dummy, placeImages (M4)
```

## 2. Layar & user story

Setiap frame di Figma menjadi satu file di `src/screens/`. Tab bar: **Jelajahi | Rencana | Template | Profil**. Layar lain dibuka di atas tab lewat Stack.

| Figma | Screen | User story | Endpoint |
|---|---|---|---|
| 01 Onboarding | `OnboardingScreen` | – | – |
| 10 Masuk / Daftar | `AuthScreen` | Akun & peran | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| 02 Jelajahi | `JelajahiScreen` (tab) | US-01 jelajahi & filter Katalog Tempat | `GET /places` |
| 03 Detail Tempat | `DetailTempatScreen` | US-01, tambah ke rencana | `GET /places/{id}`, `GET /templates?place_id` |
| 04 Buat Itinerary | `BuatItineraryScreen` | US-02 itinerary N hari | – (validasi lokal) |
| 14 Menyusun | `MenyusunScreen` | US-02 | `POST /itineraries` |
| 05 & 12 Detail Itinerary | `DetailItineraryScreen` | US-03 rute & cuaca, US-04 kunci & ubah urutan, US-06 bagikan | `GET`/`PATCH /itineraries/{id}`, `POST /itineraries/{id}/share` |
| 13 Usulan Pengganti | `UsulanPenggantiScreen` (modal) | US-03 RAIN_RISK | `POST /itineraries` (rencana baru dengan stop pengganti) |
| 06 & 15 Konteks Hari | `KonteksHariScreen` | US-05 kisah, acara, kuliner | Orkestrasi: `/context/stories`, `/context/events`, `/context/food` |
| 11 Rencana Saya | `RencanaSayaScreen` (tab) | daftar itinerary + status | `GET /itineraries` |
| 07 Template | `TemplateScreen` (tab) | US-06 template & rute unggulan mitra | `GET /templates` |
| 08 Rencana Ajaib | `RencanaAjaibScreen` | US-07 teks bebas | Orkestrasi: `/context/plan-parse` |
| 09 Profil | `ProfilScreen` (tab) | akun, menu admin | – |
| 16 Admin Tambah Tempat | `AdminTambahTempatScreen` | aturan bisnis 9 | `POST /places` (JWT admin) |
| – | `TentangScreen` | nama & NIM tim (latihan M5) | `GET /health` |

## 3. Komponen reusable

Satu file berisi satu komponen (`export default`). Warna selalu diambil dari `COLORS`, dan ukuran mengikuti Figma (frame 390 dp, skala 1×, jadi angka di Figma sama dengan dp).

| Komponen | Komponen Figma | Dipakai di | Props utama |
|---|---|---|---|
| `Button` | Button/Primary · Secondary · Ghost | semua layar | `title`, `variant` (primary, secondary, accent, outline, ghost, danger), `size`, `icon`, `loading`, `disabled`, `onPress` |
| `CustomInput` | Input/Field · Input/Search | Auth, Jelajahi, Buat Itinerary, Admin, Ajaib | `label`, `error`, `hint`, `icon`, `rounded`, `multiline`, `secureTextEntry` (+ semua props TextInput) |
| `HeaderBar` | Nav/AppBar | semua layar | `title`, `subtitle`, `onBack`, `right`, `large` |
| `Chip` · `CategoryChips` | Chip/Default · Chip/Selected | Jelajahi, Template, Rencana Saya, Admin | `items`, `selected`, `onSelect`, `multi`, `wrap` |
| `Badge` · `CategoryBadge` | Badge/Outdoor · Category · Mitra | kartu tempat, detail, template | `label`, `tone` / `category` |
| `PlaceCard` | Card/Place | Jelajahi | `place`, `onPress`, `selected`, `onToggleSelect` |
| `StopItem` | Item/Stop | Detail Itinerary | `stop`, `index`, `leg`, `isLast`, `editing`, `onMoveUp/Down`, `onToggleLock` |
| `WeatherChip` | Weather/Chip | Detail Itinerary | `weather` |
| `RainAlert` | Alert/RainRisk | Detail Itinerary | `probability`, `alternativesCount`, `onPress` |
| `DayTabs` | Tab/Day-Active · Default | Detail Itinerary | `count`, `selected`, `onSelect` |
| `ContextCard` | Card/Context | Konteks Hari, Detail Itinerary | `kind` (kisah, acara, kuliner), `title`, `source` |
| `TemplateCard` | Card/Template | Template, Detail Tempat | `template`, `coverPlace`, `width` |
| `SectionHeader` | SectionHeader | Jelajahi, Buat Itinerary, Template | `title`, `count`, `actionLabel`, `onAction` |
| `RouteMap` | peta rute (layar 05) | Detail Itinerary | `stops`, `height` (diproyeksikan dari koordinat asli, react-native-svg) |
| `StateView` | – | semua daftar | `loading`, `error`, `onRetry`, `empty`, `emptyTitle` (tiga kondisi wajib M7) |
| `ServiceErrorCard` | layar 15 | Konteks Hari | `title`, `message`, `onRetry` |
| `Screen` · `BottomBar` | kerangka layar | semua layar | `header`, `footer`, `maxWidth`, `keyboard`, `onRefresh` |
| lainnya | – | – | `AppText`, `Icon`, `IconButton`, `IconBox`, `Card`, `ListRowCard`, `MenuItem`, `InfoNote`, `Segmented`, `Stepper`, `DateStrip`, `ToggleRow`, `StepList`, `BottomSheet`, `StatTile`, `Avatar`, `SelectedPlaceRow`, `PlaceImage`, `Illustration`, `FeatureBanner` |

## 4. Token desain

`src/theme/` adalah salinan langsung Variables & Text styles di Figma (koleksi **Bolang Tokens**). Untuk mengganti tema, cukup ubah file di folder ini.

| Peran | Warna | Variabel Figma | Dipakai untuk |
|---|---|---|---|
| `primary` | `#1F8A63` | color/green/500 | CTA, tab aktif, chip terpilih |
| `accent` | `#6D5AD6` | color/purple/500 | Rencana Ajaib (AI), stop terkunci |
| `info` | `#3C7DD9` | color/semantic/rain | cuaca, kategori curug |
| `warning` | `#E39A2B` | color/semantic/warn | RAIN_RISK, tidak terjadwal, label mitra |
| `danger` | `#E2563F` | color/semantic/danger | keluar, galat |

Tone (pasangan latar + teks) mengikuti variabel alias di Figma: `category/*` (curug biru, situs sejarah ungu, kawah amber, alam hijau), `context/*` (kisah ungu, acara amber, kuliner hijau), dan `status/*` (draft ungu, selesai hijau, perlu disegarkan amber). Font **Plus Jakarta Sans** (400/500/600/700) dimuat lewat `@expo-google-fonts/plus-jakarta-sans`. Ukurannya mengikuti text style Figma: Display 30, H1 24, H2 20, H3 17, Title 15, Body 14, Small 13, Label 13, Caption 11.

## 5. Integrasi API

Base URL dibaca dari `.env` (`EXPO_PUBLIC_API_URL`). Setiap request punya batas waktu 12 detik dan bisa dibatalkan (tombol "Batalkan" di layar Menyusun memakai `AbortController`).

**Microservice Jelajah Rute** (kontrak di README backend):

| Fungsi di `ApiService.js` | Method & path | Auth |
|---|---|---|
| `login`, `register`, `getMe` | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` | – / JWT |
| `getPlaces(params)` | `GET /places?category&region_code&outdoor&page&limit` (diambil sekali, `limit=100`, lalu difilter di aplikasi) | Publik |
| `getPlace(id)`, `createPlace(token, place)` | `GET /places/{id}`, `POST /places` | Publik / JWT admin |
| `createItinerary`, `getItineraries`, `getItinerary`, `updateItinerary`, `shareItinerary` | `/itineraries` (POST, GET, GET id, PATCH id, POST id/share) | JWT |
| `getTemplates(params)` | `GET /templates?place_id&days` | Publik |
| `getWeather`, `estimateRoute`, `health` | `GET /weather`, `POST /route/estimate`, `GET /health` | Publik |

Galat `{"error":"KODE","message":"..."}` diubah menjadi pesan ramah dalam Bahasa Indonesia di `src/services/errors.js` (misalnya `INVALID_CREDENTIALS` menjadi "Email atau kata sandi salah."). Galat 401 (`TOKEN_EXPIRED`) lewat `withAuth()` di AuthContext akan mengeluarkan pengguna secara otomatis.

**Orkestrasi Rencana** (`EXPO_PUBLIC_ORCHESTRATOR_URL`). Ini **kontrak usulan** dari sisi aplikasi dan perlu disepakati dengan layanan integrasi:

| Fungsi | Method & path | Respons yang diharapkan |
|---|---|---|
| `getStories(regionCodes)` | `GET /context/stories?region_codes=32.17,32.73` | `[{ id, title, summary, region_code }]` (diteruskan dari Kisah & Kalender Budaya) |
| `getEvents(regionCode, from, to)` | `GET /context/events?region_code&from&to` | `[{ id, title, date, summary }]` |
| `getNearbyFood(lat, lon)` | `GET /context/food?lat&lon&radius_m` | `[{ id, name, cuisine, distance_m, open_now }]` (NearbyFood dari Xplor Bandung) |
| `parsePlan(text)` | `POST /context/plan-parse` `{ text }` | `{ days, area, interests[], start_label, place_ids[] }` |

Jika `EXPO_PUBLIC_ORCHESTRATOR_URL` kosong, bagian konteks hari menampilkan kartu "belum tersedia" dan Rencana Ajaib menawarkan form biasa. Aplikasi tidak crash. Hasil `parsePlan` disaring lagi di aplikasi agar hanya berisi `place_id` yang ada di Katalog Tempat (aturan bisnis 8).

## 6. State & navigasi

| State | Lokasi | Isi |
|---|---|---|
| Sesi login | `AuthContext` | `token`, `user`, `isAdmin`, `login`, `register`, `logout`, `withAuth`, status onboarding. Token disimpan di `expo-secure-store` sehingga pengguna tetap masuk. |
| Rencana yang disusun | `PlanContext` | `selectedIds`, `toggle`, `add`, `remove`, `replace` (dari template / Rencana Ajaib), `count` (badge tab Rencana) |
| Form | `useForm` | `values`, `errors`, `handleChange`, `setValue`, `handleSubmit`, `reset` |
| Data server | `useApi` | `data`, `loading`, `refreshing`, `error`, `refetch` (loading, error + Coba lagi, pull-to-refresh) |

```
Stack.Navigator
├── Onboarding              (hanya saat pertama dibuka)
├── Main → Tab.Navigator    Jelajahi | Rencana | Template | Profil
├── Auth
├── DetailTempat · BuatItinerary · Menyusun · DetailItinerary
├── UsulanPengganti         (transparentModal, lembar bawah)
└── KonteksHari · RencanaAjaib · AdminTambahTempat · Tentang
```

## 7. Responsive & aksesibilitas

- `useResponsive()` (memakai `useWindowDimensions`) menentukan jumlah kolom: Jelajahi 1/2/3 kolom dan Template 1/2/3 kolom untuk HP / layar ≥ 600 dp / tablet ≥ 768 dp. `FlatList` memakai `key={numColumns}`.
- Konten dibatasi `MAX_WIDTH` (form 560, daftar 760, grid 1120) dan dipusatkan, jadi tetap rapi di tablet, HP lipat, landscape (`orientation: "default"`), dan web.
- Header & tombol bawah memakai `useSafeAreaInsets` (notch dan home indicator). Gambar memakai `width: '100%'` + `aspectRatio`. `RouteMap` membaca lebarnya lewat `onLayout`.
- Area sentuh minimal 44 dp, setiap tombol ikon punya `accessibilityLabel`, chip/segmen memakai `accessibilityState`, dan teks dibatasi `maxFontSizeMultiplier={1.4}` agar tata letak tidak pecah saat font sistem diperbesar.
- Performa: `memo(PlaceCard)`, `memo(StopItem)`, filter dengan `useMemo`, serta `initialNumToRender` & `windowSize` pada FlatList.

## 8. Menjalankan

Prasyarat: Node.js LTS, Expo Go versi SDK 58 di HP, serta HP & laptop di Wi-Fi yang sama.

```bash
cd mobile                       # dari root repo
npm install
npx expo install --fix          # samakan versi paket native dengan SDK Expo yang terpasang
cp .env.example .env            # isi EXPO_PUBLIC_API_URL (default sudah https://bertigasamatitut.stei.fun/api)
npx expo start -c               # scan QR dengan Expo Go
```

Tanpa server (demo / mengerjakan UI): set `EXPO_PUBLIC_USE_DUMMY=true` di `.env`, lalu `npx expo start -c`. Akun dummy `demo@bolang.id` / `bolang2026` berperan admin agar layar Admin bisa dicoba.

**Akun demo server (peran user):** `demo@bolang.id` / `bolang2026` (tombol "Isi akun demo" di layar Masuk).

| Masalah | Solusi |
|---|---|
| `Network request failed` | Buka `https://bertigasamatitut.stei.fun/api/health` di browser HP. Cek `.env` lalu `npx expo start -c` |
| "Project is incompatible with this version of Expo Go" | Perbarui Expo Go, atau jalankan `npx expo install --fix` |
| Konteks hari "belum tersedia" | `EXPO_PUBLIC_ORCHESTRATOR_URL` belum diisi atau layanan integrasi mati. Bagian lain tetap jalan |
| HP tidak terhubung | `npx expo start --tunnel` |

## 9. Testing

```bash
npm test          # mode watch
npm run test:ci   # sekali jalan
```

| File | Isi | Jumlah |
|---|---|---|
| `validators-test.js` | form akun, form itinerary (tanggal ≤ 15 hari, 1–7 hari), form tempat (koordinat Bandung Raya, kode Kemendagri, jam) | 13 |
| `format-test.js` | tanggal Indonesia, jarak, durasi, ikon cuaca, parser jam buka (string, objek per hari, nama hari Indonesia, array) | 9 |
| `itinerary-test.js` | judul, leg ke stop berikutnya, `moveItem` immutable, payload PATCH, ganti stop RAIN_RISK, status | 6 |
| `ajaib-test.js` | ekstraksi parameter & aturan bisnis 8 (hanya tempat dari katalog) | 3 |
| `ApiService-test.js` | `fetch` tiruan: query, login, pesan galat ramah, Bearer token, jaringan putus, orkestrasi belum diatur | 7 |
| `Button-test.js` · `CustomInput-test.js` | render, tekan, disabled, loading, pesan error, ketikan | 6 |

Contoh test case untuk laporan pengujian (Modul 8):

| ID | Skenario | Langkah | Hasil yang diharapkan |
|---|---|---|---|
| TC-01 | Memuat katalog | Buka tab Jelajahi | Spinner, lalu daftar tempat dari server |
| TC-02 | Filter & cari | Ketuk chip "Curug", ketik "dago" | Hanya Curug Dago yang tampil |
| TC-03 | Server mati | Matikan gateway lalu tarik untuk refresh | Pesan galat + tombol "Coba lagi" |
| TC-04 | Validasi masuk | Isi email "sari@" lalu Masuk | "Format email tidak valid" |
| TC-05 | Buat itinerary | Pilih 5 tempat, 2 hari, lalu Susun | Layar Menyusun, lalu Detail per hari dengan waktu tiba dalam jam buka |
| TC-06 | Tidak terjadwal | Pilih 7 tempat, 1 hari | Tempat yang tak muat tampil beserta alasan |
| TC-07 | RAIN_RISK | Buka hari dengan peluang hujan ≥ 70% | Banner RAIN_RISK, lalu lembar usulan pengganti indoor ≤ 10 km |
| TC-08 | Kunci & ubah urutan | Ubah urutan, kunci stop, lalu Simpan | `PATCH` terkirim, urutan baru & ikon kunci ungu |
| TC-09 | Bagikan template | Tandai selesai, lalu Bagikan template | Muncul di tab Template tanpa data pribadi |
| TC-10 | Layanan mitra mati | Kosongkan URL orkestrasi, buka Konteks Hari | Hanya bagian kisah/kuliner yang berisi "belum tersedia" |
| TC-11 | Token kedaluwarsa | Tunggu lebih dari 1 jam, buka Rencana | Keluar otomatis + ajakan masuk |
| TC-12 | Responsif | Buka di tablet / web lebar | Jelajahi 2–3 kolom, konten di tengah |

## 10. Build APK

```bash
npm install -g eas-cli
eas login
eas build:configure                    # menautkan proyek ke akun expo.dev
eas build -p android --profile preview # hasil: file .apk
```

Profil `preview` di `eas.json` sudah berisi `EXPO_PUBLIC_API_URL=https://bertigasamatitut.stei.fun/api` karena APK tidak membaca `.env` laptop dan memblokir http biasa. Isi juga `EXPO_PUBLIC_ORCHESTRATOR_URL` jika layanan integrasi sudah online. Untuk versi berikutnya, naikkan `version` & `android.versionCode` di `app.json`.
