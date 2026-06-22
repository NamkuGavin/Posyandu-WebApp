# Mitra Posyandu

Mitra Posyandu adalah aplikasi web untuk membantu kader Posyandu mencatat dan memantau data balita. Aplikasi ini mencakup login kader, dashboard ringkasan, pencarian balita, pendaftaran balita, input dan edit pengukuran, absensi bulanan, laporan statistik, export Excel, dan insight pertumbuhan berbasis AI.

Project ini adalah frontend Next.js. Data utama seperti balita, pengukuran, absensi, auth, dan laporan diambil dari backend API melalui `NEXT_PUBLIC_API_URL`.

## Tech Stack

| Kebutuhan | Teknologi |
| --- | --- |
| Framework | Next.js 16.2.4 |
| UI Library | React 19.2.4 |
| Bahasa | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Icon | lucide-react |
| Chart | Recharts |
| Linting | ESLint 9 + eslint-config-next |
| Package manager | npm |

Catatan: versi Node.js belum dikunci di `package.json`. Gunakan Node.js versi modern yang kompatibel dengan Next.js 16.

## Fitur Utama

- Login kader menggunakan NIK atau username.
- Dashboard ringkasan Posyandu bulan berjalan.
- Daftar, pencarian, filter, tambah, edit, dan hapus data balita.
- Input dan update pengukuran balita per bulan.
- Absensi balita per bulan.
- Laporan statistik absensi dan pengukuran.
- Export laporan ke Excel.
- Insight AI untuk membantu membaca tren pengukuran balita.

## Struktur Project

```text
.
|-- app/
|   |-- api/ai-insight/
|   |   |-- route.ts           # HTTP entry point insight AI
|   |   |-- insight-config.ts  # Konfigurasi provider dan referensi
|   |   |-- insight-service.ts # Engine analisis dan integrasi Groq
|   |   `-- insight-types.ts   # Tipe input internal insight
|   |-- dashboard/             # Halaman utama setelah login
|   |   |-- absen/             # Absensi balita
|   |   |-- admin/kader/       # Manajemen akun kader oleh admin
|   |   |-- balita/            # Daftar, detail, tambah, edit, ukur balita
|   |   |-- cari/              # Pencarian balita
|   |   `-- laporan/           # Statistik dan export laporan
|   |-- lib/
|   |   |-- api.ts             # Facade public untuk seluruh API client
|   |   |-- api/               # API per domain dan normalizer response
|   |   |-- constants.ts       # Konstanta domain bersama
|   |   |-- date-utils.ts      # Kalkulasi dan format usia
|   |   |-- form-utils.ts      # Normalisasi dan validasi input
|   |   |-- measurement-period.ts # Aturan periode pengukuran
|   |   |-- measurement-status.ts # Status ukur dan kehadiran
|   |   |-- usePeriodData.ts   # Hook data balita per bulan/tahun
|   |   `-- who-anthro.ts      # Perhitungan antropometri WHO
|   |-- types/index.ts         # TypeScript types untuk data domain
|   |-- globals.css            # Global CSS dan Tailwind import
|   |-- layout.tsx             # Root layout
|   `-- page.tsx               # Redirect awal ke /login
|-- components/
|   |-- auth/                  # Komponen login
|   |-- balita/                # Komponen form, grafik, insight, dan dialog
|   |-- dashboard/             # Metrik dan progress reusable
|   |-- layout/                # Navbar dan Sidebar
|   |-- laporan/               # Visualisasi khusus laporan
|   `-- ui/                    # Komponen UI reusable
|-- public/                    # Asset publik
|-- proxy.ts                   # Route guard auth
|-- package.json               # Script dan dependency
`-- package-lock.json          # Lock file npm
```

## Routing

Project ini memakai Next.js App Router. Route penting:

| Route | Fungsi |
| --- | --- |
| `/` | Redirect ke `/login` |
| `/login` | Halaman login kader |
| `/dashboard` | Dashboard ringkasan |
| `/dashboard/admin/kader` | Manajemen akun kader untuk admin |
| `/dashboard/cari` | Pencarian balita |
| `/dashboard/cari?mode=ukur` | Pencarian balita untuk input pengukuran |
| `/dashboard/absen` | Absensi bulanan |
| `/dashboard/laporan` | Laporan statistik dan export Excel |
| `/dashboard/balita` | Daftar balita |
| `/dashboard/balita/tambah` | Form tambah balita |
| `/dashboard/balita/[id]` | Detail balita |
| `/dashboard/balita/[id]/edit` | Edit data balita dan pengukuran |
| `/dashboard/balita/[id]/ukur` | Input pengukuran balita |
| `/api/ai-insight` | API route internal untuk insight AI |

## Setup Local

Clone repository, lalu install dependency dengan npm.

```bash
npm install
```

Buat file `.env.local` di root project berdasarkan `.env.example`. Jangan
commit `.env`, `.env.local`, atau file environment lokal lainnya.

```env
NEXT_PUBLIC_API_URL=https://alamat-backend.example.com
GROQ_API_KEY=isi_dengan_api_key_groq
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL=llama-3.1-8b-instant
```

Jalankan development server.

```bash
npm run dev
```

Buka aplikasi di browser:

```text
http://localhost:3000
```

## Environment Variables

| Variable | Wajib | Dipakai di | Fungsi |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Ya | `app/lib/api/client.ts` | Base URL backend untuk auth, dashboard, balita, pengukuran, absensi, dan laporan |
| `GROQ_API_KEY` | Tidak | `app/api/ai-insight/insight-service.ts` | API key Groq untuk fitur insight AI |
| `GROQ_API_URL` | Tidak | `app/api/ai-insight/insight-config.ts` | Endpoint chat completion Groq |
| `GROQ_MODEL` | Tidak | `app/api/ai-insight/insight-config.ts` | Model Groq yang digunakan untuk insight |

Catatan penting:

- `NEXT_PUBLIC_API_URL` akan ikut terbaca di browser karena memakai prefix `NEXT_PUBLIC_`.
- URL backend bukan secret. Jangan menaruh token, password, atau API key di variabel dengan prefix `NEXT_PUBLIC_`.
- `GROQ_API_KEY`, `GROQ_API_URL`, dan `GROQ_MODEL` hanya dibaca oleh API route server.
- Jika `GROQ_API_KEY` kosong atau provider gagal, insight berbasis aturan dan data pengukuran tetap digunakan.
- `GROQ_API_URL` dan `GROQ_MODEL` memiliki nilai default, tetapi tetap dicantumkan agar konfigurasi deployment eksplisit.
- `app/lib/api.ts` akan error jika `NEXT_PUBLIC_API_URL` belum dikonfigurasi.

## API dan Backend

Frontend mengakses backend melalui facade `app/lib/api.ts`. Implementasinya
dipisahkan berdasarkan domain di `app/lib/api/`:

- `client.ts`: base URL, token, header auth, dan penanganan `401`.
- `auth.ts`: login, logout, dan profil pengguna.
- `kader.ts`: manajemen akun kader.
- `balita.ts`: dashboard statistik dan data balita.
- `pengukuran.ts`: data pengukuran.
- `absensi.ts`: absensi manual.
- `laporan.ts`: export laporan dan request insight.
- `normalizers.ts`: adaptasi response backend ke tipe frontend.

Endpoint yang digunakan:

| Area | Endpoint |
| --- | --- |
| Auth | `POST /auth/login`, `GET /auth/me` |
| Dashboard | `GET /beranda` |
| Balita | `GET /balita`, `GET /balita/:id`, `POST /balita`, `PATCH /balita/:id`, `DELETE /balita/:id` |
| Pengukuran | `POST /pengukuran`, `PATCH /pengukuran/:pengukuranId` |
| Absensi | `GET /absensi`, `POST /absensi/bulk` |
| Laporan | `GET /laporan/export/excel` |

Backend wajib mengembalikan token login sebagai `access_token`. Token ini disimpan di cookie `session` dan dikirim ke backend sebagai header:

```text
Authorization: Bearer <token>
```

## Auth

Auth frontend memakai cookie `session`.

- Login sukses menyimpan `access_token` ke cookie `session`.
- Request API setelah login memakai `Authorization: Bearer <token>`.
- Jika backend mengembalikan status `401`, cookie `session` dihapus dan user diarahkan ke `/login`.
- `proxy.ts` melindungi semua route `/dashboard/*`.
- User yang sudah login dan membuka `/login` akan diarahkan ke `/dashboard`.

## State Management

Project ini belum memakai state management global seperti Redux, Zustand, atau React Query.

Pola yang dipakai:

- React local state: `useState`, `useEffect`, `useMemo`, dan `useCallback`.
- Context hanya dipakai untuk toast notification di `components/ui/Toast.tsx`.
- Data balita, pengukuran, dan absensi per periode memakai
  `app/lib/usePeriodData.ts` agar loading, error, dan pembatalan request
  konsisten.
- Halaman detail yang memiliki kebutuhan khusus tetap memakai fungsi domain
  dari facade `app/lib/api.ts`.

## Pola Arsitektur Frontend

- File `page.tsx` bertugas mengatur route, state halaman, dan orkestrasi data.
- UI yang memiliki tanggung jawab mandiri ditempatkan di `components/`.
- Logic domain reusable ditempatkan di `app/lib/`, bukan disalin ke halaman.
- Semua akses backend melewati `app/lib/api.ts`; jangan memanggil URL backend
  langsung dari halaman.
- Response backend dinormalisasi di `app/lib/api/normalizers.ts` sebelum
  digunakan komponen.
- `route.ts` internal dibuat tipis. Logic insight berada di modul service dan
  konfigurasi terpisah.
- Status pengukuran harus memakai `isCompletedMeasurement`, bukan sekadar
  keberadaan record pengukuran.
- Absensi dan pengukuran adalah dua status berbeda. Absensi tetap mengikuti
  response endpoint absensi.

## Menambah Fitur

1. Tambahkan atau perbarui tipe domain di `app/types/index.ts`.
2. Tambahkan pemanggilan endpoint pada file domain yang sesuai di
   `app/lib/api/`.
3. Export fungsi tersebut melalui `app/lib/api.ts`.
4. Letakkan formatter, validator, atau aturan periode reusable di `app/lib/`.
5. Letakkan UI reusable di folder komponen sesuai domain.
6. Jaga `page.tsx` sebagai orkestrator dan hindari menaruh seluruh UI serta
   business logic dalam satu file.
7. Jalankan lint dan production build sebelum merge.

## Database

Frontend ini tidak memiliki akses database langsung dan tidak menyimpan schema atau migration. Semua data permanen berasal dari backend API yang dikonfigurasi lewat `NEXT_PUBLIC_API_URL`.

## Script

| Command | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan development server |
| `npm run build` | Membuat production build |
| `npm run start` | Menjalankan hasil production build |
| `npm run lint` | Menjalankan ESLint |

## Build

Untuk memastikan project siap production:

```bash
npm run lint
npm run build
```

Jika `npm run build` gagal karena env belum ada, pastikan `.env.local` sudah berisi `NEXT_PUBLIC_API_URL`.

## Catatan untuk Maintainer

- Jangan mengubah App Router menjadi Pages Router kecuali memang direncanakan.
- Jangan mengganti package manager dari npm tanpa alasan kuat.
- Jangan mengganti Tailwind CSS dengan styling system lain tanpa migrasi terencana.
- Jangan commit file environment lokal atau secret API key. `.env.example`
  boleh di-commit karena hanya berisi placeholder.
- Jangan mengubah kontrak payload API tanpa memastikan backend sudah sesuai.
- Jangan menambahkan `"use client"` sembarangan. Pakai Client Component hanya untuk state, event handler, hook React, atau browser API.
- Gunakan konstanta, formatter, validator, dan aturan periode yang sudah ada di
  `app/lib/`; jangan membuat implementasi baru di halaman.
- Pertahankan `app/lib/api.ts` sebagai facade agar import halaman stabil.
- Perhatikan rule pengukuran balita: periode tidak boleh sebelum bulan lahir
  atau setelah bulan berjalan.
- Perubahan auth perlu dicek bersama `app/lib/api/auth.ts`,
  `app/lib/api/client.ts`, `proxy.ts`, dan halaman login.
- Perubahan insight perlu menjaga hasil rule-based tetap tersedia saat Groq
  tidak dikonfigurasi.

## Catatan Public Repository

Sebelum repository dibuat public, pastikan:

- Tidak ada secret di file yang akan di-commit.
- `.env` dan `.env.local` tetap masuk `.gitignore`, sedangkan `.env.example`
  tetap aman untuk dokumentasi.
- URL backend production yang private tidak ditulis langsung di source code.
- Asset di `public/` memang boleh dipublikasikan.
- Dependency dan script di `package.json` sudah sesuai dengan environment deployment.
