import {
  PHONE_MAX_LENGTH,
  PHONE_MIN_LENGTH,
  PHONE_NUMBER_PATTERN,
} from "@/lib/constants";

const WHATSAPP_LOCAL_MAX_LENGTH = PHONE_MAX_LENGTH - 1;

export const WHATSAPP_INPUT_MAX_LENGTH = PHONE_MAX_LENGTH + 3;

export function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function toOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeWhatsappLocalInput(value: string) {
  const trimmed = value.trim();
  let digits = trimmed.startsWith("+62")
    ? trimmed.slice(3).replace(/\D/g, "")
    : trimmed.replace(/\D/g, "");

  if (digits.startsWith("62")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);

  return digits.slice(0, WHATSAPP_LOCAL_MAX_LENGTH);
}

export function getWhatsappPayload(localNumber: string) {
  const normalized = normalizeWhatsappLocalInput(localNumber);
  return normalized ? `0${normalized}` : "";
}

export function validateOptionalWhatsapp(localNumber: string) {
  if (!localNumber.trim()) return null;

  const payload = getWhatsappPayload(localNumber);
  if (payload.length < PHONE_MIN_LENGTH || payload.length > PHONE_MAX_LENGTH) {
    return "Nomor WhatsApp harus 10-13 digit jika diisi";
  }

  if (!PHONE_NUMBER_PATTERN.test(payload)) {
    return "Nomor WhatsApp harus mengikuti format 08, 62, atau +62";
  }

  return null;
}
