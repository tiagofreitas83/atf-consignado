// Contrato com o back-end do consignado. Todos os valores da proposta vêm da
// API — o front só formata, nunca calcula.
//
// O link chega como www.atf.com.br/consignado/<token>. O token é opaco para o
// front (CPF cifrado no servidor): ele só é repassado à API. Nenhum dado
// pessoal da proposta é entregue antes de o CPF digitado conferir com o token.

import type { TipoChavePix } from "../lib/pix";

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

export type VerificacaoCpf =
  | { status: "ok"; proposta: Proposta }
  | { status: "nao-confere"; tentativasRestantes: number }
  | { status: "bloqueado" };

export type InstituicaoPix = { nome: string; codigo: string };

/** Conta de destino do crédito, sempre no CPF do trabalhador. */
export type DestinoPix = {
  tipo: TipoChavePix;
  chaveMascarada: string;
  instituicao: InstituicaoPix;
  /** Nome do titular mascarado, ex.: "Mariana S. L." */
  titularMascarado: string;
};

/** Resultado da busca automática por chave Pix no CPF do trabalhador. */
export type ConsultaPix =
  | { status: "cpf"; destino: DestinoPix }
  | { status: "outras-chaves" }
  | { status: "sem-chaves" };

export type ValidacaoChavePix =
  | { status: "ok"; destino: DestinoPix }
  | { status: "outro-titular" }
  | { status: "nao-encontrada" };

export type Assinatura = { protocolo: string; ccbUrl: string };

export type Consentimento = {
  token: string;
  versaoTermos: string;
  versaoPrivacidade: string;
};

export type Canal = "email" | "sms";

export type TipoDocumento = "cnh" | "rg";

/** "pdf": arquivo exportado da carteira digital; "foto": frente e verso digitalizados com a câmera. */
export type OrigemDocumento = "pdf" | "foto";

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
  /** POST /consentimentos — o back-end grava timestamp e IP. */
  registrarConsentimento(c: Consentimento): Promise<void>;
  /**
   * POST /proposta/verificar — confere o CPF com o token do link e, só então,
   * devolve a proposta. Erros consomem tentativas; esgotadas, o link é bloqueado.
   */
  verificarCpf(req: { token: string; cpf: string }): Promise<VerificacaoCpf>;
  /** POST /pix/consultar — busca no DICT as chaves Pix do CPF do trabalhador. */
  consultarPix(req: { propostaId: string }): Promise<ConsultaPix>;
  /** POST /pix/validar — valida uma chave informada; só aceita se for do CPF do trabalhador. */
  validarChavePix(req: { propostaId: string; tipo: TipoChavePix; chave: string }): Promise<ValidacaoChavePix>;
  /** POST /assinatura/codigo — envia o código de 6 dígitos por e-mail ou SMS. */
  enviarCodigo(req: { propostaId: string; canal: Canal; destino: string }): Promise<void>;
  /** POST /assinatura/codigo/confirmar — lança `CodigoInvalidoError` se não confere. */
  confirmarCodigo(req: { propostaId: string; canal: Canal; codigo: string }): Promise<void>;
  /**
   * POST /assinatura/documento — CNH ou RG. Com `origem: "pdf"`, um arquivo da
   * carteira digital (o back-end valida o QR Code/assinatura); com `"foto"`,
   * frente e verso (OCR, autenticidade e extração da foto para a biometria).
   */
  validarDocumento(req: { propostaId: string; tipo: TipoDocumento; origem: OrigemDocumento; arquivos: Blob[] }): Promise<ValidacaoDocumento>;
  /** POST /assinatura/biometria — prova de vida + comparação com a foto do documento. */
  enviarBiometria(req: { propostaId: string; captura: Blob | null }): Promise<ResultadoBiometria>;
  /** POST /ccb/assinar — só é aceito com e-mail, SMS, documento e biometria confirmados. */
  assinar(req: { propostaId: string }): Promise<Assinatura>;
}
