import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { maskPhoneBR, onlyDigits } from "../ds";
import {
  CodigoInvalidoError,
  type Assinatura,
  type Canal,
  type ConsignadoApi,
  type DestinoPix,
  type Proposta,
  type OrigemDocumento,
  type TipoDocumento,
} from "../api/types";
import { cpfValido } from "../lib/cpf";
import { emailValido } from "../lib/format";
import { detectarChave } from "../lib/pix";

export type Step = 1 | 2 | 3 | 4 | 5;
export type Doc = "termos" | "privacidade" | "lgpd";
export type ConsultaPixStatus = "idle" | "consultando" | "cpf" | "outras-chaves" | "sem-chaves" | "erro";
export type ChaveStatus = "idle" | "validando" | "ok" | "outro-titular" | "nao-encontrada" | "erro";
export type TutorialPix = "criar" | "trocar";

/** Confirmação de um canal (e-mail ou SMS) por código de 6 dígitos. */
export type Verificacao = {
  status: "pendente" | "enviando" | "enviado" | "confirmando" | "ok";
  codigo: string;
  erro: string | null;
};

export type Documento = {
  tipo: TipoDocumento | null;
  origem: OrigemDocumento | null;
  status: "idle" | "validando" | "ok" | "rejeitado";
  titular: string | null;
  erro: string | null;
};

/** Etapas da assinatura, na ordem. */
export const ETAPAS_ASSINATURA = ["ccb", "email", "sms", "documento", "biometria"] as const;
export type EtapaAssinatura = (typeof ETAPAS_ASSINATURA)[number];

const VERIFICACAO_INICIAL: Verificacao = { status: "pendente", codigo: "", erro: null };
const DOCUMENTO_INICIAL: Documento = { tipo: null, origem: null, status: "idle", titular: null, erro: null };
const CHAVE_VERIFICACAO = { email: "emailVerif", sms: "smsVerif" } as const;

// Versões dos textos aceitos, registradas junto com o consentimento.
const VERSAO_TERMOS = "2026-10-provisorio";
const VERSAO_PRIVACIDADE = "2026-10-provisorio";

type State = {
  step: Step;
  proposta: Proposta | null;
  consent: boolean;
  consentEnviando: boolean;
  /** CPF digitado no passo 2 para liberar a proposta. */
  cpfInput: string;
  cpfVerificando: boolean;
  cpfErroApi: string | null;
  cpfBloqueado: boolean;
  propostaConfirmada: boolean;
  doc: Doc | null;
  pixConsulta: ConsultaPixStatus;
  /** Conta da chave CPF encontrada na consulta automática. */
  pixCpfDestino: DestinoPix | null;
  /** A pessoa preferiu informar outra chave (celular, e-mail ou aleatória). */
  outraChave: boolean;
  chaveInput: string;
  chaveStatus: ChaveStatus;
  chaveDestino: DestinoPix | null;
  /** Aba aberta na ajuda de chave Pix (sheet), ou null se fechada. */
  tutorial: TutorialPix | null;
  email: string;
  phone: string;
  ccbAceite: boolean;
  ccbRevisada: boolean;
  emailVerif: Verificacao;
  smsVerif: Verificacao;
  documento: Documento;
  biometria: "pendente" | "enviando" | "ok" | "falhou";
  biometriaErro: string | null;
  signing: boolean;
  assinaturaErro: string | null;
  assinatura: Assinatura | null;
};

type Action =
  | { type: "proposta"; proposta: Proposta }
  | { type: "set"; patch: Partial<State> }
  | { type: "email"; value: string }
  | { type: "phone"; value: string }
  | { type: "verificacao"; canal: Canal; patch: Partial<Verificacao> };

const initial: State = {
  step: 1,
  proposta: null,
  consent: false,
  consentEnviando: false,
  cpfInput: "",
  cpfVerificando: false,
  cpfErroApi: null,
  cpfBloqueado: false,
  propostaConfirmada: false,
  doc: null,
  pixConsulta: "idle",
  pixCpfDestino: null,
  outraChave: false,
  chaveInput: "",
  chaveStatus: "idle",
  chaveDestino: null,
  tutorial: null,
  email: "",
  phone: "",
  ccbAceite: false,
  ccbRevisada: false,
  emailVerif: VERIFICACAO_INICIAL,
  smsVerif: VERIFICACAO_INICIAL,
  documento: DOCUMENTO_INICIAL,
  biometria: "pendente",
  biometriaErro: null,
  signing: false,
  assinaturaErro: null,
  assinatura: null,
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "proposta": {
      const t = a.proposta.trabalhador;
      return {
        ...s,
        proposta: a.proposta,
        cpfVerificando: false,
        cpfErroApi: null,
        email: s.email || t.email || "",
        phone: s.phone || maskPhoneBR(t.celular ?? ""),
      };
    }
    case "set":
      return { ...s, ...a.patch };
    case "email":
      // Trocar o contato desfaz a confirmação daquele canal.
      return a.value === s.email ? s : { ...s, email: a.value, emailVerif: VERIFICACAO_INICIAL };
    case "phone":
      return a.value === s.phone ? s : { ...s, phone: a.value, smsVerif: VERIFICACAO_INICIAL };
    case "verificacao": {
      const k = CHAVE_VERIFICACAO[a.canal];
      return { ...s, [k]: { ...s[k], ...a.patch } };
    }
  }
}

/** Conta para onde o crédito vai: a chave CPF encontrada ou a chave informada. */
function destinoPix(s: State): DestinoPix | null {
  if (s.pixConsulta === "cpf" && !s.outraChave) return s.pixCpfDestino;
  return s.chaveStatus === "ok" ? s.chaveDestino : null;
}

/** Passo mais avançado que os pré-requisitos já liberam. */
function maxStep(s: State, recebimentoOk: boolean): Step {
  if (s.assinatura) return 5;
  if (!s.consent) return 1;
  if (!s.proposta || !s.propostaConfirmada) return 2;
  if (!recebimentoOk) return 3;
  return 4;
}

const readStepFromUrl = () => Number(new URLSearchParams(window.location.search).get("step")) || 1;

function writeStepToUrl(step: Step, mode: "push" | "replace") {
  const url = new URL(window.location.href);
  url.searchParams.set("step", String(step));
  if (url.href === window.location.href) return;
  window.history[mode === "push" ? "pushState" : "replaceState"]({ step }, "", url);
}

/**
 * @param token identificador opaco do link (www.atf.com.br/consignado/<token>);
 *   só é repassado à API, nunca interpretado no front.
 */
export function useConsignado(api: ConsignadoApi, token: string) {
  const [s, dispatch] = useReducer(reducer, initial);
  const set = useCallback((patch: Partial<State>) => dispatch({ type: "set", patch }), []);
  const pixReq = useRef(0);
  const chaveReq = useRef(0);

  const cpfInputDigits = onlyDigits(s.cpfInput);
  const phoneDigits = onlyDigits(s.phone);
  const emailOk = emailValido(s.email);
  const phoneOk = phoneDigits.length === 11;
  const pixDestino = destinoPix(s);
  const recebimentoOk = Boolean(pixDestino);
  // Com uma chave digitada (ainda não verificada), "Seguir" já fica liberado e faz a verificação.
  const informandoChave = s.pixConsulta === "outras-chaves" || (s.pixConsulta === "cpf" && s.outraChave);
  const chaveDigitada = detectarChave(s.chaveInput);
  const podeSeguirRecebimento = recebimentoOk || (informandoChave && Boolean(chaveDigitada) && chaveDigitada?.tipo !== "cnpj");
  const limite = maxStep(s, recebimentoOk);
  const concluidas: Record<EtapaAssinatura, boolean> = {
    ccb: s.ccbRevisada,
    email: s.emailVerif.status === "ok",
    sms: s.smsVerif.status === "ok",
    documento: s.documento.status === "ok",
    biometria: s.biometria === "ok",
  };
  const etapaAtual: EtapaAssinatura | null = ETAPAS_ASSINATURA.find((e) => !concluidas[e]) ?? null;

  // Espelha o passo na URL; voltar/avançar do navegador respeitam os gates.
  const limiteRef = useRef(limite);
  limiteRef.current = limite;
  const assinadoRef = useRef(false);
  assinadoRef.current = Boolean(s.assinatura);

  useEffect(() => {
    writeStepToUrl(s.step, "replace");
    const onPop = () => {
      const pedido = readStepFromUrl();
      const step = (assinadoRef.current ? 5 : Math.min(Math.max(pedido, 1), limiteRef.current)) as Step;
      set({ step });
      if (step !== pedido) writeStepToUrl(step, "replace");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // Só no mount: o acesso direto a ?step=N sem pré-requisitos cai no passo 1.
  }, [set]);

  const go = useCallback(
    (step: Step) => {
      set({ step });
      writeStepToUrl(step, "push");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [set],
  );

  const enviarCodigo = useCallback(
    async (propostaId: string, canal: Canal) => {
      dispatch({ type: "verificacao", canal, patch: { status: "enviando", codigo: "", erro: null } });
      try {
        await api.enviarCodigo({ propostaId, canal, destino: canal === "email" ? s.email : phoneDigits });
        dispatch({ type: "verificacao", canal, patch: { status: "enviado" } });
      } catch {
        dispatch({ type: "verificacao", canal, patch: { status: "pendente", erro: "Não conseguimos enviar o código. Tente novamente." } });
      }
    },
    [api, s.email, phoneDigits],
  );

  const verificarChave = useCallback(
    async (propostaId: string) => {
      const chave = detectarChave(s.chaveInput);
      if (!chave || chave.tipo === "cnpj") return false;
      const req = ++chaveReq.current;
      set({ chaveStatus: "validando", chaveDestino: null });
      try {
        const r = await api.validarChavePix({ propostaId, tipo: chave.tipo, chave: chave.normalizada });
        if (req !== chaveReq.current) return false;
        set(r.status === "ok" ? { chaveStatus: "ok", chaveDestino: r.destino } : { chaveStatus: r.status });
        return r.status === "ok";
      } catch {
        if (req === chaveReq.current) set({ chaveStatus: "erro" });
        return false;
      }
    },
    [api, set, s.chaveInput],
  );

  const consultarPix = useCallback(
    async (propostaId: string) => {
      const req = ++pixReq.current;
      set({ pixConsulta: "consultando", outraChave: false, tutorial: null });
      try {
        const r = await api.consultarPix({ propostaId });
        if (req !== pixReq.current) return;
        set({
          pixConsulta: r.status,
          pixCpfDestino: r.status === "cpf" ? r.destino : null,
        });
      } catch {
        if (req === pixReq.current) set({ pixConsulta: "erro" });
      }
    },
    [api, set],
  );

  const actions = useMemo(
    () => ({
      setConsent: (consent: boolean) => set({ consent }),
      openDoc: (doc: Doc) => set({ doc }),
      closeDoc: () => set({ doc: null }),

      async aceitarConsentimento() {
        set({ consentEnviando: true });
        try {
          await api.registrarConsentimento({ token, versaoTermos: VERSAO_TERMOS, versaoPrivacidade: VERSAO_PRIVACIDADE });
          go(2);
        } finally {
          set({ consentEnviando: false });
        }
      },

      setCpfInput: (cpfInput: string) => set({ cpfInput, cpfErroApi: null }),

      /** Confere o CPF com o token; só então a proposta chega ao front. */
      async verificarCpf() {
        set({ cpfVerificando: true, cpfErroApi: null });
        try {
          const r = await api.verificarCpf({ token, cpf: cpfInputDigits });
          if (r.status === "ok") return dispatch({ type: "proposta", proposta: r.proposta });
          if (r.status === "bloqueado") return set({ cpfVerificando: false, cpfBloqueado: true });
          const n = r.tentativasRestantes;
          set({
            cpfVerificando: false,
            cpfErroApi: `Este CPF não confere com a proposta. Você ainda tem ${n} ${n === 1 ? "tentativa" : "tentativas"}.`,
          });
        } catch {
          set({ cpfVerificando: false, cpfErroApi: "Não foi possível verificar agora. Tente novamente." });
        }
      },

      confirmarProposta(propostaId: string) {
        set({ propostaConfirmada: true });
        go(3);
        if (s.pixConsulta === "idle" || s.pixConsulta === "erro") consultarPix(propostaId);
      },

      consultarPix,

      setOutraChave: (outraChave: boolean) => {
        chaveReq.current++;
        set({ outraChave, chaveInput: "", chaveStatus: "idle", chaveDestino: null });
      },

      setChave: (chaveInput: string) => {
        chaveReq.current++; // descarta validação em andamento
        set({ chaveInput, chaveStatus: "idle", chaveDestino: null });
      },

      /** Verifica a chave digitada no diretório Pix; devolve se ela é da pessoa. */
      verificarChave,

      /** Segue para a assinatura; se a chave ainda não foi verificada, verifica aqui, e um erro fica no campo. */
      async seguirRecebimento(propostaId: string) {
        if (pixDestino || (await verificarChave(propostaId))) go(4);
      },

      setTutorial: (tutorial: TutorialPix | null) => set({ tutorial }),
      setEmail: (value: string) => dispatch({ type: "email", value }),
      setPhone: (value: string) => dispatch({ type: "phone", value }),

      setCcbAceite: (ccbAceite: boolean) => set({ ccbAceite }),

      enviarCodigo,

      continuarCcb: () => set({ ccbRevisada: true }),

      /** Volta a editar o e-mail/celular antes de reenviar o código. */
      alterarContato: (canal: Canal) => dispatch({ type: "verificacao", canal, patch: { status: "pendente", codigo: "", erro: null } }),

      setCodigo: (canal: Canal, codigo: string) =>
        dispatch({ type: "verificacao", canal, patch: { codigo: onlyDigits(codigo).slice(0, 6), erro: null } }),

      async confirmarCodigo(propostaId: string, canal: Canal) {
        const v = canal === "email" ? s.emailVerif : s.smsVerif;
        dispatch({ type: "verificacao", canal, patch: { status: "confirmando", erro: null } });
        try {
          await api.confirmarCodigo({ propostaId, canal, codigo: v.codigo });
          dispatch({ type: "verificacao", canal, patch: { status: "ok" } });
        } catch (e) {
          const onde = canal === "email" ? "o e-mail" : "o SMS";
          dispatch({
            type: "verificacao",
            canal,
            patch: {
              status: "enviado",
              erro: e instanceof CodigoInvalidoError ? `Código inválido. Confira ${onde} e tente novamente.` : "Não foi possível confirmar agora. Tente novamente.",
            },
          });
        }
      },

      setTipoDocumento: (tipo: TipoDocumento) => set({ documento: { ...DOCUMENTO_INICIAL, tipo, origem: s.documento.origem } }),
      setOrigemDocumento: (origem: OrigemDocumento) => set({ documento: { ...DOCUMENTO_INICIAL, tipo: s.documento.tipo, origem } }),

      async validarDocumento(propostaId: string, arquivos: Blob[]) {
        const { tipo, origem } = s.documento;
        if (!tipo || !origem) return;
        set({ documento: { ...s.documento, status: "validando", erro: null } });
        try {
          const r = await api.validarDocumento({ propostaId, tipo, origem, arquivos });
          set({
            documento:
              r.status === "ok"
                ? { tipo, origem, status: "ok", titular: r.titular, erro: null }
                : { tipo, origem, status: "rejeitado", titular: null, erro: r.motivo },
          });
        } catch {
          set({ documento: { tipo, origem, status: "rejeitado", titular: null, erro: "Não foi possível validar agora. Tente novamente." } });
        }
      },

      async enviarBiometria(propostaId: string, captura: Blob | null) {
        set({ biometria: "enviando", biometriaErro: null });
        try {
          const r = await api.enviarBiometria({ propostaId, captura });
          set(r.status === "ok" ? { biometria: "ok" } : { biometria: "falhou", biometriaErro: r.motivo });
        } catch {
          set({ biometria: "falhou", biometriaErro: "Não foi possível concluir o reconhecimento. Tente novamente." });
        }
      },

      async assinar(propostaId: string) {
        set({ signing: true, assinaturaErro: null });
        try {
          const assinatura = await api.assinar({ propostaId });
          set({ assinatura, signing: false });
          go(5);
        } catch {
          set({ signing: false, assinaturaErro: "Não foi possível assinar agora. Tente novamente." });
        }
      },

      /** Avança respeitando os gates. */
      next: () => s.step < limite && go((s.step + 1) as Step),
      back: () => go((s.step - 1) as Step),
    }),
    [api, token, go, set, s.step, s.emailVerif, s.documento, s.pixConsulta, s.chaveInput, pixDestino, cpfInputDigits, limite, enviarCodigo, consultarPix, verificarChave],
  );

  return {
    state: s,
    actions,
    derived: {
      cpfInputDigits,
      cpfInputOk: cpfInputDigits.length === 11 && cpfValido(cpfInputDigits),
      cpfInputErro: cpfInputDigits.length === 11 && !cpfValido(cpfInputDigits) ? "CPF inválido." : undefined,
      pixDestino,
      phoneDigits,
      emailOk,
      phoneOk,
      emailErro: s.email && !emailOk ? "Informe um e-mail válido." : undefined,
      phoneErro: phoneDigits.length && !phoneOk ? "Informe o celular com DDD." : undefined,
      recebimentoOk,
      podeSeguirRecebimento,
      concluidas,
      etapaAtual,
    },
  };
}

export type Flow = ReturnType<typeof useConsignado>;
