import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { maskPhoneBR, onlyDigits } from "../ds";
import {
  CodigoInvalidoError,
  type Assinatura,
  type Canal,
  type ConsignadoApi,
  type Proposta,
  type TipoDocumento,
  type ValidacaoPix,
} from "../api/types";
import { cpfValido } from "../lib/cpf";
import { emailValido } from "../lib/format";

export type Step = 1 | 2 | 3 | 4 | 5;
export type Doc = "termos" | "privacidade" | "lgpd";
export type PixStatus = "idle" | "loading" | "ok" | "notfound";

/** Confirmação de um canal (e-mail ou SMS) por código de 6 dígitos. */
export type Verificacao = {
  status: "pendente" | "enviando" | "enviado" | "confirmando" | "ok";
  codigo: string;
  erro: string | null;
};

export type Documento = {
  tipo: TipoDocumento | null;
  status: "idle" | "validando" | "ok" | "rejeitado";
  titular: string | null;
  erro: string | null;
};

/** Etapas da assinatura, na ordem. */
export const ETAPAS_ASSINATURA = ["ccb", "email", "sms", "documento", "biometria"] as const;
export type EtapaAssinatura = (typeof ETAPAS_ASSINATURA)[number];

const VERIFICACAO_INICIAL: Verificacao = { status: "pendente", codigo: "", erro: null };
const DOCUMENTO_INICIAL: Documento = { tipo: null, status: "idle", titular: null, erro: null };
const CHAVE_VERIFICACAO = { email: "emailVerif", sms: "smsVerif" } as const;

// Versões dos textos aceitos, registradas junto com o consentimento.
const VERSAO_TERMOS = "2026-10-provisorio";
const VERSAO_PRIVACIDADE = "2026-10-provisorio";

type State = {
  step: Step;
  proposta: Proposta | null;
  propostaErro: boolean;
  consent: boolean;
  consentEnviando: boolean;
  propostaConfirmada: boolean;
  doc: Doc | null;
  cpfPix: string;
  pix: PixStatus;
  pixResultado: Extract<ValidacaoPix, { status: "ok" }> | null;
  tutorial: boolean;
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
  | { type: "propostaErro" }
  | { type: "set"; patch: Partial<State> }
  | { type: "cpfPix"; value: string }
  | { type: "email"; value: string }
  | { type: "phone"; value: string }
  | { type: "verificacao"; canal: Canal; patch: Partial<Verificacao> }
  | { type: "pixResultado"; resultado: ValidacaoPix };

const initial: State = {
  step: 1,
  proposta: null,
  propostaErro: false,
  consent: false,
  consentEnviando: false,
  propostaConfirmada: false,
  doc: null,
  cpfPix: "",
  pix: "idle",
  pixResultado: null,
  tutorial: false,
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
        propostaErro: false,
        email: s.email || t.email || "",
        phone: s.phone || maskPhoneBR(t.celular ?? ""),
      };
    }
    case "propostaErro":
      return { ...s, propostaErro: true };
    case "set":
      return { ...s, ...a.patch };
    case "cpfPix":
      // Qualquer edição da chave invalida a validação anterior.
      return { ...s, cpfPix: a.value, pix: "idle", pixResultado: null };
    case "email":
      // Trocar o contato desfaz a confirmação daquele canal.
      return a.value === s.email ? s : { ...s, email: a.value, emailVerif: VERIFICACAO_INICIAL };
    case "phone":
      return a.value === s.phone ? s : { ...s, phone: a.value, smsVerif: VERIFICACAO_INICIAL };
    case "verificacao": {
      const k = CHAVE_VERIFICACAO[a.canal];
      return { ...s, [k]: { ...s[k], ...a.patch } };
    }
    case "pixResultado":
      return a.resultado.status === "ok"
        ? { ...s, pix: "ok", pixResultado: a.resultado }
        : { ...s, pix: "notfound", pixResultado: null, tutorial: true };
  }
}

/** Erro do campo de CPF — só aparece com os 11 dígitos digitados. */
function cpfErro(digits: string, titular: string | undefined) {
  if (digits.length !== 11) return undefined;
  if (!cpfValido(digits)) return "CPF inválido.";
  if (titular && digits !== titular) return "A chave precisa ser o CPF do titular do crédito.";
  return undefined;
}

/** Passo mais avançado que os pré-requisitos já liberam. */
function maxStep(s: State, recebimentoOk: boolean): Step {
  if (s.assinatura) return 5;
  if (!s.consent || !s.proposta) return 1;
  if (!s.propostaConfirmada) return 2;
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

export function useConsignado(api: ConsignadoApi) {
  const [s, dispatch] = useReducer(reducer, initial);
  const set = useCallback((patch: Partial<State>) => dispatch({ type: "set", patch }), []);
  const pixReq = useRef(0);

  const carregarProposta = useCallback(() => {
    set({ propostaErro: false });
    api.getProposta().then(
      (proposta) => dispatch({ type: "proposta", proposta }),
      () => dispatch({ type: "propostaErro" }),
    );
  }, [api, set]);

  useEffect(carregarProposta, [carregarProposta]);

  const cpfDigits = onlyDigits(s.cpfPix);
  const titular = s.proposta?.trabalhador.cpf;
  const phoneDigits = onlyDigits(s.phone);
  const emailOk = emailValido(s.email);
  const phoneOk = phoneDigits.length === 11;
  const cpfDoTitular = cpfDigits.length === 11 && cpfValido(cpfDigits) && cpfDigits === titular;
  const recebimentoOk = cpfDoTitular && s.pix === "ok";
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

  const actions = useMemo(
    () => ({
      setConsent: (consent: boolean) => set({ consent }),
      openDoc: (doc: Doc) => set({ doc }),
      closeDoc: () => set({ doc: null }),

      async aceitarConsentimento(propostaId: string) {
        set({ consentEnviando: true });
        try {
          await api.registrarConsentimento({ propostaId, versaoTermos: VERSAO_TERMOS, versaoPrivacidade: VERSAO_PRIVACIDADE });
          go(2);
        } finally {
          set({ consentEnviando: false });
        }
      },

      confirmarProposta() {
        set({ propostaConfirmada: true });
        go(3);
      },

      setCpfPix: (value: string) => {
        pixReq.current++; // descarta validação em andamento
        dispatch({ type: "cpfPix", value });
      },

      async validarPix(propostaId: string, cpf: string) {
        const req = ++pixReq.current;
        set({ pix: "loading" });
        try {
          const resultado = await api.validarPix({ propostaId, cpf });
          if (req === pixReq.current) dispatch({ type: "pixResultado", resultado });
        } catch {
          if (req === pixReq.current) set({ pix: "idle" });
        }
      },

      toggleTutorial: () => set({ tutorial: !s.tutorial }),
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

      setTipoDocumento: (tipo: TipoDocumento) => set({ documento: { ...DOCUMENTO_INICIAL, tipo } }),

      async validarDocumento(propostaId: string, arquivo: Blob) {
        const tipo = s.documento.tipo;
        if (!tipo) return;
        set({ documento: { ...s.documento, status: "validando", erro: null } });
        try {
          const r = await api.validarDocumento({ propostaId, tipo, arquivo });
          set({
            documento:
              r.status === "ok"
                ? { tipo, status: "ok", titular: r.titular, erro: null }
                : { tipo, status: "rejeitado", titular: null, erro: r.motivo },
          });
        } catch {
          set({ documento: { tipo, status: "rejeitado", titular: null, erro: "Não foi possível validar agora. Tente novamente." } });
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
      carregarProposta,
    }),
    [api, go, set, s.tutorial, s.step, s.emailVerif, s.documento, limite, enviarCodigo, carregarProposta],
  );

  return {
    state: s,
    actions,
    derived: {
      cpfErro: cpfErro(cpfDigits, titular),
      cpfDoTitular,
      cpfDigits,
      phoneDigits,
      emailOk,
      phoneOk,
      emailErro: s.email && !emailOk ? "Informe um e-mail válido." : undefined,
      phoneErro: phoneDigits.length && !phoneOk ? "Informe o celular com DDD." : undefined,
      recebimentoOk,
      concluidas,
      etapaAtual,
    },
  };
}

export type Flow = ReturnType<typeof useConsignado>;
