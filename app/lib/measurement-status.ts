import { Absensi, Pengukuran } from "@/types";

export function isCompletedMeasurement(
  measurement?: Pick<Pengukuran, "beratBadan" | "tinggiBadan"> | null,
) {
  if (!measurement) return false;

  const weight = Number(measurement.beratBadan);
  const height = Number(measurement.tinggiBadan);

  return (
    Number.isFinite(weight) &&
    Number.isFinite(height) &&
    weight > 0 &&
    height > 0
  );
}

export function getMeasuredBalitaIds(measurements: Pengukuran[]) {
  return new Set(
    measurements
      .filter(isCompletedMeasurement)
      .map((measurement) => measurement.balitaId)
      .filter((id): id is string => Boolean(id)),
  );
}

export function getEffectiveAttendance(
  balitaId: string,
  attendance: Absensi[],
) {
  const attendanceRecord = attendance.find(
    (item) => item.balitaId === balitaId,
  );

  return attendanceRecord?.isHadir ?? false;
}
