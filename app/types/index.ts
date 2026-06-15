export interface Pengukuran {
  id?: string;
  balitaId?: string;
  bulan: number;       // 1-12
  tahun: number;       // e.g. 2026
  tglUkur?: string;
  beratBadan: number;  // kg
  tinggiBadan: number; // cm
  lingkarKepala: number | null; // cm
  lingkarLengan: number | null; // cm
  lila?: number | null;
  createdAt?: string;
}

export interface Absensi {
  id?: string;
  balitaId: string;
  bulan: number;
  tahun: number;
  isHadir: boolean;
  createdAt?: string;
}

export interface Balita {
  id: string;
  nama: string;
  nik: string;
  jenisKelamin: "LAKI_LAKI" | "PEREMPUAN";
  namaWali: string;
  nikWali: string;
  noKk?: string;
  noWhatsapp: string;
  alamat: string;
  rt: string;
  rw: string;
  tglLahir: string; // ISO String / YYYY-MM-DD
  anakKe: number;
  beratLahir: number;
  panjangLahir: number;
  lingkarKepalaLahir: number | null;
  usiaKehamilan: number | null;
  pengukuran?: Pengukuran[];
  absensi?: Absensi[];
  createdAt?: string;
}

export interface BerandaStats {
  totalBalita: number;
  hadirBulanIni: number;
  belumHadir: number;
  belumDiukur: number;
}

export type UserRole = "ADMIN" | "KADER";

export interface KaderProfile {
  id?: string;
  nik?: string;
  username?: string;
  email?: string;
  nama?: string;
  role?: UserRole | string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateKaderPayload = {
  nik: string;
  username: string;
  email: string;
  nama: string;
  password: string;
};

export type UpdateKaderPayload = Partial<CreateKaderPayload>;
