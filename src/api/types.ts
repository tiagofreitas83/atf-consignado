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

export type Canal = "email" | "sms";

export type TipoDocumento = "cnh" | "cin";

export type ValidacaoDocumento =
  | { status: "ok"; tipo: TipoDocumento; titular: string }
  | { status: "rejeitado"; motivo: string };

export type ResultadoBiometria = { status: "ok" } | { status: "falhou"; motivo: string };

export class CodigoInvalidoError extends Error {
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
  /** POST /assinatura/codigo — envia o código de 6 dígitos por e-mail ou SMS. */
  enviarCodigo(req: { propostaId: string; canal: Canal; destino: string }): Promise<void>;
  /** POST /assinatura/codigo/confirmar — lança `CodigoInvalidoError` se não confere. */
  confirmarCodigo(req: { propostaId: string; canal: Canal; codigo: string }): Promise<void>;
  /**
   * POST /assinatura/documento — documento exportado da carteira digital
   * (CNH do Brasil ou gov.br). O back-end valida o QR Code/assinatura do PDF.
   */
  validarDocumento(req: { propostaId: string; tipo: TipoDocumento; arquivo: Blob }): Promise<ValidacaoDocumento>;
  /** POST /assinatura/biometria — prova de vida + comparação com a foto do documento. */
  enviarBiometria(req: { propostaId: string; captura: Blob | null }): Promise<ResultadoBiometria>;
  /** POST /ccb/assinar — só é aceito com e-mail, SMS, documento e biometria confirmados. */
  assinar(req: { propostaId: string }): Promise<Assinatura>;
}
