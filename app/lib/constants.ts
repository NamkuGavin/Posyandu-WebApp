export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export const NIK_LENGTH = 16;
export const PHONE_MIN_LENGTH = 10;
export const PHONE_MAX_LENGTH = 13;
export const PHONE_NUMBER_PATTERN = /^(08|62|\+62)[0-9]{9,13}$/;

export const POSYANDU_DEFAULTS = {
  alamat: "Kecamatan Sidorejo Kidul",
  rw: "09",
} as const;
