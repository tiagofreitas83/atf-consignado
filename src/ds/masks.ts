// Máscaras do DS (components/forms/masks.js) usadas na jornada.

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const maskCPF = (value: string) =>
  onlyDigits(value)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");

export const maskPhoneBR = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
};

export const MASKS = { cpf: maskCPF, phone: maskPhoneBR, number: onlyDigits } as const;
export type MaskType = keyof typeof MASKS;
