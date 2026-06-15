# AGENTS.md

## Project Context

Ini adalah project Next.js yang sudah berjalan lama. Jangan mengubah arsitektur utama tanpa alasan kuat.

Sebelum mengedit file:

1. baca struktur project,
2. cek pola kode yang sudah ada,
3. ikuti gaya coding existing,
4. jelaskan rencana perubahan,
5. ubah file seminimal mungkin.

## Important Rules

- Jangan migrasi Pages Router ke App Router kecuali diminta.
- Jangan mengubah JavaScript ke TypeScript kecuali diminta.
- Jangan mengganti styling system existing.
- Jangan mengganti package manager.
- Jangan install dependency baru tanpa izin.
- Jangan menghapus file tanpa konfirmasi.
- Jangan mengubah `.env` atau menampilkan isi `.env`.
- Jangan mengubah database schema/migration tanpa konfirmasi.
- Jangan menjalankan command destructive.

## Workflow

Untuk setiap task:

1. pahami request,
2. cari file yang relevan,
3. jelaskan rencana perubahan,
4. edit file seminimal mungkin,
5. jelaskan file yang berubah,
6. beri cara test/manual check.

## Next.js Rules

- Jika project memakai App Router, ikuti pola folder `app/`.
- Jika project memakai Pages Router, ikuti pola folder `pages/`.
- Jangan menambahkan `"use client"` sembarangan.
- Gunakan Client Component hanya jika butuh state, event handler, hook React, atau browser API.
- Logic reusable sebaiknya diletakkan mengikuti pola existing, misalnya di `lib/`, `utils/`, `services/`, atau folder lain yang sudah dipakai project ini.

## Response Format

Setelah selesai, jawab dengan:

1. Ringkasan perubahan
2. File yang diubah
3. Cara menjalankan/test
4. Risiko atau hal yang perlu dicek manual
