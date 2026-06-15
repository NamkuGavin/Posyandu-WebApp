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
|   |-- api/ai-insight/        # API route internal untuk insight AI
|   |-- dashboard/             # Halaman utama setelah login
|   |   |-- absen/             # Absensi balita
|   |   |-- balita/            # Daftar, detail, tambah, edit, ukur balita
|   |   |-- cari/              # Pencarian balita
|   |   `-- laporan/           # Statistik dan export laporan
|   |-- lib/api.ts             # Client API ke backend
|   |-- types/index.ts         # TypeScript types untuk data domain
|   |-- globals.css            # Global CSS dan Tailwind import
|   |-- layout.tsx             # Root layout
|   `-- page.tsx               # Redirect awal ke /login
|-- components/
|   |-- auth/                  # Komponen login
|   |-- layout/                # Navbar dan Sidebar
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

Buat file `.env.local` di root project. Jangan commit file `.env`, `.env.local`, atau file env lain karena sudah berisi konfigurasi lokal atau rahasia.

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
GROQ_API_KEY=isi_dengan_api_key_groq_jika_diperlukan
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
| `NEXT_PUBLIC_API_URL` | Ya | `app/lib/api.ts` | Base URL backend untuk auth, dashboard, balita, pengukuran, absensi, dan laporan |
| `GROQ_API_KEY` | Tidak | `app/api/ai-insight/route.ts` | API key Groq untuk fitur insight AI |

Catatan penting:

- `NEXT_PUBLIC_API_URL` akan ikut terbaca di browser karena memakai prefix `NEXT_PUBLIC_`.
- `GROQ_API_KEY` hanya dipakai server-side di API route internal.
- Jika `GROQ_API_KEY` kosong, fitur insight AI tetap menampilkan fallback text.
- `app/lib/api.ts` akan error jika `NEXT_PUBLIC_API_URL` belum dikonfigurasi.

## API dan Backend

Frontend ini mengakses backend melalui helper di `app/lib/api.ts`. Endpoint yang digunakan:

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

- React local state: `useState`, `useEffect`, `useMemo`, `useCallback`.
- Context hanya dipakai untuk toast notification di `components/ui/Toast.tsx`.
- Data halaman diambil langsung dari helper API di `app/lib/api.ts`.

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
- Jangan commit file `.env*` atau secret API key.
- Jangan mengubah kontrak payload API tanpa memastikan backend sudah sesuai.
- Jangan menambahkan `"use client"` sembarangan. Pakai Client Component hanya untuk state, event handler, hook React, atau browser API.
- Perhatikan rule pengukuran balita: beberapa flow memakai bulan dan tahun berjalan.
- Perubahan auth perlu dicek bersama `app/lib/api.ts`, `proxy.ts`, dan halaman login.

## Catatan Public Repository

Sebelum repository dibuat public, pastikan:

- Tidak ada secret di file yang akan di-commit.
- `.env*` tetap masuk `.gitignore`.
- URL backend production yang private tidak ditulis langsung di source code.
- Asset di `public/` memang boleh dipublikasikan.
- Dependency dan script di `package.json` sudah sesuai dengan environment deployment.
