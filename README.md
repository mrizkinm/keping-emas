# Keping Emas

Aplikasi web portofolio emas fisik lokal-first (*privacy-focused*) untuk pasar Indonesia. Melacak kepemilikan kepingan logam mulia (**Antam LM**, **UBS Gold**, **Galeri 24**, dan **HRTA Gold / EMASKU**) dengan kalkulasi otomatis estimasi likuidasi *buyback* dan keuntungan/kerugian (*PnL*), didukung feed harga harian langsung.

---

## Fitur Utama

- **Live Scraping, Riwayat Harian & Fallback Harga Kemarin**:
  - Scraping otomatis dari portal resmi Galeri24 Pegadaian (`https://galeri24.co.id/harga-emas`) dan PT Hartadinata Abadi Tbk (`https://hartadinataabadi.co.id`).
  - *In-memory cache* 20 menit & penyimpanan riwayat harian persisten (`prices-history.json`).
  - **Fallback Cerdas**: Jika koneksi besoknya bermasalah/error, server otomatis mengambil **harga riil kemarin** yang tersimpan di disk.
  - Tampilan riwayat harga 1 gram harian di menu Harga Pasar untuk melihat pergerakan harga.
- **Dukungan Penuh Offline (PWA Service Worker)**:
  - Dilengkapi Service Worker natif (`sw.js`) untuk mencache App Shell: aplikasi dapat dibuka penuh saat HP offline / *Airplane Mode*.
  - Penyimpanan harga riil terakhir di browser klien (`localStorage`): kalkulasi portofolio dan likuidasi langsung tampil instan dalam 0 ms tanpa koneksi internet.
- **Kalkulasi Likuidasi & PnL Otomatis**:
  - Menghitung nilai beli total, estimasi nilai buyback resmi terkini, selisih untung/rugi nominal (Rp) dan persentase (%).
  - Memperhitungkan *spread* dan penyesuaian biaya cetak (*minting fee*) pecahan mikro (0.1g – 3g).
- **Kalkulator Zakat Emas Syariat (BAZNAS & PMA No. 52/2014)**:
  - Pelacakan otomatis Nisab (85 gram) dengan progress bar visual di Dashboard.
  - Perhitungan kadar zakat 2.5% dalam bobot emas fisik (gram) dan konversi Rupiah real-time.
  - Opsi filter Haul (menyaring kepingan yang telah tersimpan &ge; 1 tahun / 365 hari).
  - Pilihan acuan konversi: Harga Buyback (nilai likuidasi riil) vs Harga Jual Resmi (kehati-hatian/ihtiyath).
  - Mode ganda: sinkronisasi otomatis dari portofolio atau simulasi bebas gramasi manual.
- **Architectural SVG CertiCard Generator**:
  - Visualisasi kepingan emas CertiCard proporsional berbasis SVG untuk 4 merek tanpa aset gambar raster eksternal.
  - Skala fisik ingot menyesuaikan gramatur asli (0.1g s/d 100g).
- **Desain "Quiet Luxury" & Tema Ganda (Dark & Light Mode)**:
  - Mode Gelap: obsidian gelap (`#0C0D0E`), kartu surface (`#16181A`), aksen champagne gold (`#D4A346`).
  - Mode Terang: alabaster stone (`#F6F7F9`), kartu surface putih bersih (`#FFFFFF`), aksen rich goldenrod (`#B8860B`).
  - Tombol cepat Sun/Moon di header & setelan 3 mode (*Gelap*, *Terang*, *Otomatis Sistem*).
  - Sinkronisasi dinamis `<meta name="theme-color">` pada status bar browser mobile.
  - Tipografi tabular (`tabular-nums`) anti pergeseran layout pada perubahan digit angka.
  - Target sentuh minimum 44px × 44px (standar Apple HIG).
- **Mobile Hardware & Gesture UX**:
  - Intersep tombol fisik Back Android & swipe gesture via HTML5 History API (`popstate`): menutup modal/drawer terlebih dahulu sebelum keluar tab.
  - Gesture swipe-down untuk menutup bottom sheet `AddGoldSheet`.
  - Keypad virtual adaptif: `inputMode="numeric"` untuk nominal rupiah, `inputMode="decimal"` untuk gramasi kustom.
  - Umpan balik haptic mikro native melalui `navigator.vibrate`.
- **Keamanan & Privasi Maksimal (Local-First & Stealth Mode)**:
  - 100% data tersimpan di browser klien (`localStorage`). Nol telemetri / transmisi cloud.
  - **Mode Stealth / Sembunyikan Nominal**: Tombol cepat `Eye`/`EyeOff` untuk menyamarkan seluruh nominal portofolio (`Rp ••••••••`) saat berada di tempat umum tanpa menyembunyikan inventaris gramasi fisik.
  - Kunci keamanan PIN 4-digit terenkripsi SHA-256 via Web Crypto API native (`crypto.subtle.digest`).
  - Proteksi anti brute-force: lockout otomatis 30 detik setelah 5 kali salah input PIN.
  - File server native aman dari *path traversal attack* (`path.resolve` containment).
  - Validasi ketat skema saat ekspor/impor cadangan JSON.

---

## Tech Stack

- **Frontend**: React 19, Tailwind CSS v4, Lucide React, Vite 8.
- **Backend / Static Server**: Node.js native stdlib (`http`, `fs`, `path`, `crypto`, `fetch`) — *tanpa dependensi framework Express/Axios*.
- **Testing**: Node.js native `node:assert` runner.

---

## Struktur Repositori

```text
keping-emas/
├── dist/                     # Bundle produksi hasil build Vite
├── public/                   # Manifest PWA, service worker, & ikon SVG
├── src/
│   ├── components/
│   │   ├── AddGoldSheet.jsx  # Bottom sheet tambah/edit keping emas
│   │   ├── CertiCard.jsx     # Generator blister pack SVG proporsional
│   │   ├── PinLockModal.jsx  # Layar kunci PIN 4-digit dengan rate limiter
│   │   └── ZakatSheet.jsx    # Kalkulator zakat emas syariat & filter haul
│   ├── hooks/
│   │   └── useGoldData.js    # State portofolio lokal, SHA-256, validasi schema
│   ├── utils/
│   │   └── haptics.js        # Helper getaran mikro haptic
│   ├── views/
│   │   ├── CollectionView.jsx# Daftar koleksi fisik, filter merek & sorting
│   │   ├── DashboardView.jsx # Ringkasan portofolio, total aset, PnL
│   │   ├── PricesView.jsx    # Matriks harga jual, buyback, dan spread
│   │   └── SettingsView.jsx  # Manajemen PIN, ekspor/impor JSON, reset data
│   ├── App.jsx               # Root shell, bottom navigation, popstate back handler
│   ├── index.css             # Tema Quiet Luxury Tailwind CSS v4
│   └── main.jsx              # Entry point React & registrasi PWA
├── test/
│   └── check.js              # Test suite verifikasi logika & keamanan
├── package.json
├── server.js                 # Server HTTP, live scraper, static server aman
└── vite.config.js            # Konfigurasi bundler Vite & dev API middleware
```

---

## Panduan Menjalankan

### Kebutuhan Sistem
- Node.js versi 18 atau lebih baru.

### 1. Pemasangan Dependensi
```bash
npm install
```

### 2. Mode Pengembangan (Development)
Cukup jalankan satu perintah:
```bash
npm run dev
```
Akses antarmuka di `http://localhost:5173`. Endpoint `/api/prices` dilayani langsung oleh middleware Vite dev server.

### 3. Build & Jalankan Produksi
```bash
# Build frontend ke folder dist/
npm run build

# Jalankan server mandiri produksi
npm start
```
Buka browser dan akses `http://localhost:3001`.

### 4. Menjalankan Tes Otomatis
```bash
npm test
```
Menjalankan 12 pengujian mandiri: kalkulasi pecahan, ketersediaan 4 brand, kalkulasi PnL, enkripsi SHA-256 Web Crypto, sanitasi skema JSON, proteksi path traversal & sibling containment, sistem tema, mode privasi nominal, persistensi riwayat harga, ketersediaan Service Worker, deduplikasi pecahan, dan keandalan fallback ID generator.

---

## API Endpoints

- `GET /api/prices`: Mengambil harga resmi harian terkini (Antam, UBS, Galeri 24, HRTA) beserta pecahan dan buyback.
- `GET /api/prices?refresh=1`: Memaksa pembaruan data langsung (*bypass cache*).

---

## Lisensi & Catatan

Dibuat untuk pengelolaan aset emas pribadi. Tidak terafiliasi secara resmi dengan PT Antam Tbk, PT Untung Bersama Sejahtera, PT Pegadaian Galeri 24, atau PT Hartadinata Abadi Tbk. Seluruh merek dagang adalah hak milik masing-masing perusahaan.
