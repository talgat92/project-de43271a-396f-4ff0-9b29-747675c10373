export function normalizePhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    digits = "7" + digits;
  } else if (digits.length === 11 && digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  }

  return digits;
}

export function formatPhone(value: string): string {
  const digits = normalizePhoneDigits(value);
  if (!digits) return "";

  let formatted = digits.startsWith("7") ? "+7" : "";
  const rest = digits.startsWith("7") ? digits.slice(1) : digits;

  if (rest.length > 0) formatted += " (" + rest.slice(0, 3);
  if (rest.length >= 3) formatted += ")";
  if (rest.length > 3) formatted += " " + rest.slice(3, 6);
  if (rest.length > 6) formatted += "-" + rest.slice(6, 8);
  if (rest.length > 8) formatted += "-" + rest.slice(8, 10);

  return formatted;
}

export function isValidPhone(phone: string): boolean {
  const digits = normalizePhoneDigits(phone);
  return digits.length === 11 && digits.startsWith("7");
}
