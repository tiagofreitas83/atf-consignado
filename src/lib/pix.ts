import { cpfValido } from "./cpf";

export type TipoChavePix = "cpf" | "cnpj" | "celular" | "email" | "evp";

export type ChaveDetectada = {
  tipo: TipoChavePix;
  /** Formato enviado ao DICT: CPF/CNPJ só dígitos, celular em E.164, e-mail minúsculo, EVP com hífens. */
  normalizada: string;
  /** Como mostrar para a pessoa. */
  exibicao: string;
};

export const ROTULO_CHAVE: Record<TipoChavePix, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  celular: "Celular",
  email: "E-mail",
  evp: "Chave aleatória",
};

const EVP = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SO_NUMERICO = /^[\d\s().+/-]+$/;
const CELULAR = /^[1-9]{2}9\d{8}$/;

const fmtCelular = (d: string) => `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
const fmtCpf = (d: string) => d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

/**
 * Reconhece o tipo de chave Pix digitada num campo único, como fazem os apps
 * dos bancos. 11 dígitos com dígito verificador de CPF válido contam como CPF;
 * senão, como celular (DDD + 9 + 8 dígitos). Devolve null se não reconhecer.
 */
export function detectarChave(entrada: string): ChaveDetectada | null {
  const v = entrada.trim();
  if (!v) return null;

  if (v.includes("@")) {
    const email = v.toLowerCase();
    return EMAIL.test(email) && email.length <= 77 ? { tipo: "email", normalizada: email, exibicao: email } : null;
  }

  if (EVP.test(v)) {
    const h = v.replace(/-/g, "").toLowerCase();
    const evp = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    return { tipo: "evp", normalizada: evp, exibicao: evp };
  }

  if (!SO_NUMERICO.test(v)) return null;
  let d = v.replace(/\D/g, "");
  const comDdi = v.startsWith("+") || ((d.length === 12 || d.length === 13) && d.startsWith("55"));
  if (comDdi && d.startsWith("55")) d = d.slice(2);

  if (!comDdi && d.length === 14) return { tipo: "cnpj", normalizada: d, exibicao: d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") };
  if (!comDdi && d.length === 11 && cpfValido(d)) return { tipo: "cpf", normalizada: d, exibicao: fmtCpf(d) };
  if (CELULAR.test(d)) return { tipo: "celular", normalizada: `+55${d}`, exibicao: fmtCelular(d) };
  return null;
}
