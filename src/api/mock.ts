import { OtpInvalidoError, type ConsignadoApi, type Proposta } from "./types";

type MockOptions = {
  /** "sem-chave": a primeira validação Pix devolve `notfound`. */
  pixResultado?: "cadastrado" | "sem-chave";
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

export function createMockApi({ pixResultado = "cadastrado", horasUteis = 2, latency = 1 }: MockOptions = {}): ConsignadoApi {
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
  let tentativasPix = 0;

  return {
    async getProposta() {
      await wait(300 * latency);
      return proposta;
    },
    async registrarConsentimento() {
      await wait(200 * latency);
    },
    async validarPix() {
      await wait(1400 * latency);
      const falha = pixResultado === "sem-chave" && tentativasPix === 0;
      tentativasPix++;
      if (falha) return { status: "notfound" };
      return {
        status: "ok",
        instituicao: { nome: "Nu Pagamentos S.A.", codigo: "260" },
        titularMascarado: "Mariana S. L. · CPF ***.456.789-**",
      };
    },
    async enviarOtp() {
      await wait(400 * latency);
    },
    async assinar({ otp }) {
      await wait(1200 * latency);
      if (otp === "000000") throw new OtpInvalidoError();
      return { protocolo: "CP 2026 1016 48213", ccbUrl: "#" };
    },
  };
}
