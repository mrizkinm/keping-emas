# AGENTS.md — Petunjuk & Standar untuk AI Coding Agents

Dokumen ini adalah acuan kerja mengikat bagi AI Coding Agent (Claude Code, Antigravity, Cursor, Copilot, Codex, dll.) yang membaca, memodifikasi, atau memperluas kode di repositori **Keping Emas**.

---

## 1. Filosofi & Etos Rekayasa: *The Lazy Senior Developer*

Di repositori ini, *lazy* berarti efisien dan berfokus pada esensi, bukan ceroboh. Kode terbaik adalah kode yang tidak perlu ditulis. Ikuti tangga keputusan berikut secara ketat:

1. **YAGNI**: Apakah fitur atau baris ini benar-benar perlu ada sekarang? Jika tidak, jangan buat.
2. **Gunakan Stdlib & Fitur Platform Native Terlebih Dahulu**:
   - Backend menggunakan `node:http`, `node:fs`, `node:path`, `node:crypto`, dan native `fetch`. **Dilarang memasang framework berat seperti Express, Fastify, Axios, atau lodash.**
   - Frontend menggunakan Web Platform native: Web Crypto API (`crypto.subtle`) untuk hashing, HTML5 History API (`popstate`) untuk navigasi gesture, dan `inputMode` untuk keypad.
3. **Manfaatkan Dependensi yang Sudah Terpasang**:
   - Hanya gunakan dependensi yang ada di `package.json` (`react`, `react-dom`, `lucide-react`, `tailwindcss`).
   - Jangan menambahkan dependensi eksternal baru untuk tugas yang bisa diselesaikan dengan 10–20 baris kode stdlib.
4. **Diff Terkecil & Tidak Ada Abstraksi Prematur**:
   - Dilarang membuat factory untuk 1 produk, interface untuk 1 implementasi, atau file konfigurasi terpisah untuk nilai yang tidak pernah berubah.
   - Perubahan harus menghasilkan diff sesingkat mungkin (*shortest working diff wins*).
5. **Komentar Penyederhanaan (`ponytail:`)**:
   - Jika membuat implementasi yang sengaja disederhanakan, tandai dengan komentar berformat:
     `// ponytail: [batasan saat ini] -> [jalur peningkatan saat diperlukan]`

---

## 2. Invarian Kritis & Keamanan (Non-Negotiable)

Setiap agen yang memodifikasi kode **WAJIB** mematuhi aturan keamanan berikut:

### A. Static File Serving & Anti Path-Traversal
- Seluruh file statis yang disajikan oleh server wajib melalui fungsi `serveStaticSafe` pada `server.js`.
- Jalur file wajib dinormalisasi dan divalidasi dengan `path.relative(DIST_DIR, target)` containment (mencegah path traversal dan sibling directory traversal).
- Jangan pernah menyajikan file secara langsung dari input URL mentah.

### B. Enkripsi Kunci Keamanan (PIN)
- **Dilarang keras menyimpan PIN dalam bentuk teks biasa (plaintext)** di `localStorage` maupun memori persisten.
- Gunakan fungsi `hashPin(pin)` di `src/hooks/useGoldData.js` yang memanfaatkan `crypto.subtle.digest('SHA-256', ...)`.
- Pertahankan mekanisme *brute-force rate limiting* (lockout 30 detik setelah 5 kali percobaan gagal).

### C. Sanitasi & Validasi Data Impor
- Data yang diimpor dari file cadangan JSON wajib lolos sanitasi ketat di `validateAndSanitizeItems`.
- Validasi wajib mencakup: tipe data array, brand terdaftar (`antam`, `ubs`, `galeri24`, `hrta`, atau `other` kustom), gramatur numerik positif (`weight > 0`), dan harga beli non-negatif (`buyPrice >= 0`).

### D. Zero Cloud Leakage (Lokal-First)
- Seluruh data portofolio fisik pengguna hanya boleh hidup di browser klien (`localStorage`).
- Dilarang membuat endpoint server yang menerima atau menyimpan data portofolio pengguna.

---

## 3. Standar UX & Desain ("Quiet Luxury")

- **Palet Warna Tunggal**:
  - Background Utama: `#0C0D0E`
  - Surface Card: `#16181A`
  - Border Hairline: `#26292D`
  - Teks Utama: `#F4F5F6` | Sekunder: `#8B9097` | Muted: `#565A61`
  - Aksen Mewah: Champagne Gold `#D4A346` (hover `#C29235`)
  - Status: `#34D399` (Profit), `#F87171` (Loss)
- **Tanpa Efek Kartun**: Hindari gradasi berlebih, shadow tebal, efek glossy 3D, atau animasi berputar yang mencolok. Utamakan garis datar, presisi arsitektural, dan visual SVG ingot proporsional di `CertiCard.jsx`.
- **Tipografi Tabular**: Semua angka rupiah, gramasi, dan persentase wajib menggunakan kelas `.tabular-nums` untuk mencegah pergeseran layout dinamis.
- **Mobile Hardware & Gesture Back Navigation**:
  - Setiap modal, drawer, atau bottom sheet baru **wajib** mendaftarkan state ke `window.history.pushState`.
  - Listener `popstate` di `src/App.jsx` harus dipastikan menutup layer modal/drawer terlebih dahulu sebelum pengguna keluar dari aplikasi.
- **Formulir Mobile**:
  - Input nominal rupiah wajib `inputMode="numeric"`.
  - Input berat gramasi kustom wajib `inputMode="decimal"`.
  - Seluruh tombol dan target sentuh interaktif wajib berukuran minimal 44px × 44px (Apple HIG).

---

## 4. Mesin Scraping Harga (`server.js`)

- **Portal Scraping**:
  1. Galeri 24 Pegadaian (`https://galeri24.co.id/harga-emas`): Mengambil vendor `GALERI 24`, `ANTAM`, dan `UBS`.
  2. Hartadinata Abadi (`https://hartadinataabadi.co.id`): Mengambil harga dasar 1g EMASKU.
- **Resiliensi Jaringan**:
  - Fetch wajib dibatasi timeout 5 detik menggunakan `AbortController`.
  - Wajib memiliki fallback ke `BASE_MARKET_RATES` terkalibrasi jika request gagal atau format HTML berubah.
- **Caching**:
  - Data harga dicache in-memory dengan TTL 20 menit (`CACHE_TTL_MS = 20 * 60 * 1000`).
  - Cache dapat dibypass jika parameter query `refresh=1` diberikan.

---

## 5. Prosedur Verifikasi Sebelum Selesai (Verification Loop)

Setelah melakukan perubahan kode apa pun, agen wajib menjalankan pengujian berikut di terminal:

```bash
# 1. Jalankan test suite bawaan
npm test

# 2. Verifikasi proses build frontend tanpa error/warning
npm run build
```

Jika salah satu perintah gagal, perbaiki masalah secara langsung sebelum mengembalikan respon ke pengguna.

---

## 6. Format Respon Agen

- Utamakan aksi langsung melalui tool (*tools over conversation*).
- Berikan penjelasan singkat maksimal 3 baris setelah kode atau aksi selesai:
  ```text
  [apa yang dilakukan]
  skipped: [apa yang sengaja dilewati untuk menjaga efisiensi]
  add when: [kondisi kapan hal tersebut perlu ditambahkan]
  ```
