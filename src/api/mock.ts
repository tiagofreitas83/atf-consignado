import { CodigoInvalidoError, type ConsignadoApi, type DestinoPix, type InstituicaoPix, type Proposta } from "./types";

/**
 * Cenários da consulta Pix:
 * - "cpf": o CPF é chave (no Nubank); depois de "Já movi", aparece no Inter (portabilidade).
 * - "outras-chaves": o CPF não é chave, mas há chaves de celular/e-mail/aleatória.
 * - "sem-chaves": nenhuma chave; depois de "Já criei", o CPF passa a ser chave.
 */
export type CenarioPix = "cpf" | "outras-chaves" | "sem-chaves";

type MockOptions = {
  pix?: CenarioPix;
  horasUteis?: number;
  /** Escala dos atrasos simulados (0 nos testes). */
  latency?: number;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tabela Price — só o mock calcula; em produção o valor vem da API. */
export const pmt = (pv: number, i: number, n: number) => (pv * i) / (1 - Math.pow(1 + i, -n));
const cents = (n: number) => Math.round(n * 100) / 100;
// O README do handoff traz parcela R$ 308,34 / total R$ 11.100,24 (PMT truncado);
// o protótipo arredondava para 308,35 / 11.100,42. O mock segue o README.
const truncCents = (n: number) => Math.floor(n * 100) / 100;

const CPF_TITULAR = "12345678909";
const TITULAR = "Mariana S. L.";
const NUBANK: InstituicaoPix = { nome: "Nu Pagamentos S.A.", codigo: "260" };
const INTER: InstituicaoPix = { nome: "Banco Inter S.A.", codigo: "077" };
const ITAU: InstituicaoPix = { nome: "Itaú Unibanco S.A.", codigo: "341" };
const CAIXA: InstituicaoPix = { nome: "Caixa Econômica Federal", codigo: "104" };
const TENTATIVAS_CPF = 3;

const destinoCpf = (instituicao: InstituicaoPix): DestinoPix => ({ tipo: "cpf", chaveMascarada: "***.456.789-**", instituicao, titularMascarado: TITULAR });

export function createMockApi({ pix = "cpf", horasUteis = 2, latency = 1 }: MockOptions = {}): ConsignadoApi {
  const valor = 8000;
  const prazoMeses = 36;
  const taxaMensal = 0.0189;
  const parcela = truncCents(pmt(valor, taxaMensal, prazoMeses));
  const proposta: Proposta = {
    id: "prop-48213",
    valor,
    prazoMeses,
    taxaMensal,
    taxaAnual: 0.2519,
    cetMensal: 0.0205,
    cetAnual: 0.2758,
    parcela,
    iof: 98.4,
    total: cents(parcela * prazoMeses),
    primeiroDesconto: "2026-12",
    horasUteisPagamento: horasUteis,
    trabalhador: { nome: "Mariana Souza Lima", cpf: "12345678909", email: "mariana.lima@email.com", celular: "11987654321" },
    empregador: { razaoSocial: "Metalúrgica Aurora Ltda" },
    ccb: { numero: "513-2026-0048213" },
  };
  let consultas = 0;
  let tentativasCpf = TENTATIVAS_CPF;

  // Chaves do titular para o cenário "outras-chaves" (e para "usar outra chave").
  const chavesDoTitular: Record<string, InstituicaoPix> = {
    "mariana.lima@email.com": INTER,
    "+5511987654321": ITAU,
  };

  return {
    async registrarConsentimento() {
      await wait(200 * latency);
    },
    async verificarCpf({ cpf }) {
      await wait(700 * latency);
      if (tentativasCpf <= 0) return { status: "bloqueado" };
      if (cpf === CPF_TITULAR) return { status: "ok", proposta };
      tentativasCpf--;
      return tentativasCpf <= 0 ? { status: "bloqueado" } : { status: "nao-confere", tentativasRestantes: tentativasCpf };
    },
    async consultarPix() {
      await wait(1400 * latency);
      consultas++;
      if (pix === "sem-chaves") return consultas === 1 ? { status: "sem-chaves" } : { status: "cpf", destino: destinoCpf(NUBANK) };
      if (pix === "outras-chaves") return { status: "outras-chaves" };
      return { status: "cpf", destino: destinoCpf(consultas === 1 ? NUBANK : INTER) };
    },
    async validarChavePix({ tipo, chave }) {
      await wait(1200 * latency);
      const mascara = (c: string) => (tipo === "email" ? c.replace(/^(.).*(@.*)$/, "$1•••••$2") : tipo === "celular" ? `(${c.slice(3, 5)}) •••••-${c.slice(-4)}` : `${c.slice(0, 8)}-••••`);
      if (tipo === "cpf") return chave === CPF_TITULAR ? { status: "nao-encontrada" } : { status: "outro-titular" };
      if (tipo === "cnpj") return { status: "outro-titular" };
      if (tipo === "evp") {
        if (chave.startsWith("00000000")) return { status: "nao-encontrada" };
        return { status: "ok", destino: { tipo, chaveMascarada: mascara(chave), instituicao: CAIXA, titularMascarado: TITULAR } };
      }
      const banco = chavesDoTitular[chave];
      if (!banco) return { status: "outro-titular" };
      return { status: "ok", destino: { tipo, chaveMascarada: mascara(chave), instituicao: banco, titularMascarado: TITULAR } };
    },
    async enviarCodigo() {
      await wait(400 * latency);
    },
    async confirmarCodigo({ codigo }) {
      await wait(600 * latency);
      if (codigo === "000000") throw new CodigoInvalidoError();
    },
    async validarDocumento({ tipo }) {
      await wait(1600 * latency);
      return { status: "ok", tipo, titular: proposta.trabalhador.nome };
    },
    async enviarBiometria() {
      await wait(1500 * latency);
      return { status: "ok" };
    },
    async assinar() {
      await wait(1200 * latency);
      return { protocolo: "CP 2026 1016 48213", ccbUrl: "#" };
    },
  };
}
