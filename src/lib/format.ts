const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pctFmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "R$ 8.000,00" (com espaço normal, como no layout). */
export const brl = (n: number) => brlFmt.format(n).replace(/ /g, " ");

export const pct = (fracao: number) => `${pctFmt.format(fracao * 100)}%`;

/** "1,89% a.m. · 25,19% a.a." */
export const taxaAmAa = (mensal: number, anual: number) => `${pct(mensal)} a.m. · ${pct(anual)} a.a.`;

/** "2026-12" → "dezembro de 2026" */
export const mesAno = (competencia: string) => {
  const [ano, mes] = competencia.split("-").map(Number);
  return `${MESES[mes - 1]} de ${ano}`;
};

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const horasUteisLabel = (n: number) => (n === 1 ? "1 hora útil" : `${n} horas úteis`);

/** "(11) 98765-4321" → "(11) •••••-4321" */
export const celularMascarado = (digits: string) => `(${digits.slice(0, 2)}) •••••-${digits.slice(-4)}`;

export const primeiroNome = (nome: string) => nome.split(" ")[0];

/** "Nu Pagamentos S.A. (260)" */
export const banco = (i: { nome: string; codigo: string }) => `${i.nome} (${i.codigo})`;

export const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** "mariana.lima@email.com" → "m•••••@email.com" */
export const emailMascarado = (email: string) => {
  const [user, dominio] = email.split("@");
  return `${user.charAt(0)}•••••@${dominio ?? ""}`;
};
