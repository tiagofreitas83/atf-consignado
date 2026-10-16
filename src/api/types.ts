// Contrato com o back-end do consignado. Todos os valores da proposta vêm da
// API — o front só formata, nunca calcula.

export type Proposta = {
  id: string;
  valor: number;
  prazoMeses: number;
  /** Frações: 0.0189 = 1,89% */
  taxaMensal: number;
  taxaAnual: number;
  cetMensal: number;
  cetAnual: number;
  parcela: number;
  iof: number;
  total: number;
  /** Competência do primeiro desconto em folha, `AAAA-MM`. */
  primeiroDesconto: string;
  /** Prazo estimado do Pix após a assinatura. */
  horasUteisPagamento: number;
  trabalhador: { nome: string; cpf: string; email?: string; celular?: string };
  empregador: { razaoSocial: string };
  ccb: { numero: string };
};

export type InstituicaoPix = { nome: string; codigo: string };

export type ValidacaoPix =
  | { status: "ok"; instituicao: InstituicaoPix; titularMascarado: string }
  | { status: "notfound" };

export type Assinatura = { protocolo: string; ccbUrl: string };

export type Consentimento = {
  propostaId: string;
  versaoTermos: string;
  versaoPrivacidade: string;
};

export class OtpInvalidoError extends Error {
  constructor() {
    super("Código inválido");
  }
}

export interface ConsignadoApi {
  /** GET /proposta */
  getProposta(): Promise<Proposta>;
  /** POST /consentimentos — o back-end grava timestamp e IP. */
  registrarConsentimento(c: Consentimento): Promise<void>;
  /** POST /pix/validar — consulta DICT da chave CPF; 404 → `notfound`. */
  validarPix(req: { propostaId: string; cpf: string }): Promise<ValidacaoPix>;
  /** POST /ccb/otp */
  enviarOtp(req: { propostaId: string; email: string; celular: string }): Promise<void>;
  /** POST /ccb/assinar — lança `OtpInvalidoError` se o código não confere. */
  assinar(req: { propostaId: string; otp: string }): Promise<Assinatura>;
}
