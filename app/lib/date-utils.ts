export function calculateAgeInMonths(
  birthDateString?: string | null,
  referenceDate = new Date(),
): number | null {
  if (!birthDateString) return null;

  const birthDate = new Date(birthDateString);
  if (Number.isNaN(birthDate.getTime())) return null;

  let months =
    (referenceDate.getFullYear() - birthDate.getFullYear()) * 12 +
    referenceDate.getMonth() -
    birthDate.getMonth();

  if (referenceDate.getDate() < birthDate.getDate()) months -= 1;
  return Math.max(months, 0);
}

export function formatAgeDetailed(
  birthDateString?: string | null,
  referenceDate = new Date(),
) {
  if (!birthDateString) return "";

  const birthDate = new Date(birthDateString);
  if (Number.isNaN(birthDate.getTime())) return "";

  let years = referenceDate.getFullYear() - birthDate.getFullYear();
  let months = referenceDate.getMonth() - birthDate.getMonth();
  let days = referenceDate.getDate() - birthDate.getDate();

  if (days < 0) {
    const previousMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      0,
    );
    days += previousMonth.getDate();
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} tahun`);
  if (months > 0) parts.push(`${months} bulan`);
  if (days > 0 || parts.length === 0) parts.push(`${days} hari`);

  return parts.join(" ");
}

export function formatAgeInMonths(ageInMonths: number) {
  const years = Math.floor(ageInMonths / 12);
  const months = ageInMonths % 12;

  if (years === 0) return `${months} bulan`;
  if (months === 0) return `${years} tahun`;
  return `${years} tahun ${months} bulan`;
}
