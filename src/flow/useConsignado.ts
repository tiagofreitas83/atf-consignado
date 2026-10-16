import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { maskPhoneBR, onlyDigits } from "../ds";
import { OtpInvalidoError, type Assinatura, type ConsignadoApi, type Proposta, type ValidacaoPix } from "../api/types";
import { cpfValido } from "../lib/cpf";
import { emailValido } from "../lib/format";

export type Step = 1 | 2 | 3 | 4 | 5;
export type Doc = "termos" | "privacidade";
export type PixStatus = "idle" | "loading" | "ok" | "notfound";

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
  otpEnviando: boolean;
  otpSent: boolean;
  otp: string;
  otpErro: string | null;
  signing: boolean;
  assinatura: Assinatura | null;
};

type Action =
  | { type: "proposta"; proposta: Proposta }
  | { type: "propostaErro" }
  | { type: "set"; patch: Partial<State> }
  | { type: "cpfPix"; value: string }
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
  otpEnviando: false,
  otpSent: false,
  otp: "",
  otpErro: null,
  signing: false,
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
  const recebimentoOk = cpfDoTitular && s.pix === "ok" && emailOk && phoneOk;
  const limite = maxStep(s, recebimentoOk);

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
      setEmail: (email: string) => set({ email }),
      setPhone: (phone: string) => set({ phone }),

      setCcbAceite: (ccbAceite: boolean) => set({ ccbAceite }),

      async enviarOtp(propostaId: string) {
        set({ otpEnviando: true });
        try {
          await api.enviarOtp({ propostaId, email: s.email, celular: phoneDigits });
          set({ otpSent: true, otp: "", otpErro: null });
        } finally {
          set({ otpEnviando: false });
        }
      },

      setOtp: (otp: string) => set({ otp: onlyDigits(otp).slice(0, 6), otpErro: null }),

      async assinar(propostaId: string) {
        set({ signing: true, otpErro: null });
        try {
          const assinatura = await api.assinar({ propostaId, otp: s.otp });
          set({ assinatura, signing: false });
          go(5);
        } catch (e) {
          set({
            signing: false,
            otpErro: e instanceof OtpInvalidoError ? "Código inválido. Confira o SMS e tente novamente." : "Não foi possível assinar agora. Tente novamente.",
          });
        }
      },

      /** Avança respeitando os gates. */
      next: () => s.step < limite && go((s.step + 1) as Step),
      back: () => go((s.step - 1) as Step),
      carregarProposta,
    }),
    [api, go, set, s.tutorial, s.email, s.otp, s.step, limite, phoneDigits, carregarProposta],
  );

  return {
    state: s,
    actions,
    derived: {
      cpfErro: cpfErro(cpfDigits, titular),
      cpfDoTitular,
      cpfDigits,
      phoneDigits,
      emailErro: s.email && !emailOk ? "Informe um e-mail válido." : undefined,
      phoneErro: phoneDigits.length && !phoneOk ? "Informe o celular com DDD." : undefined,
      recebimentoOk,
    },
  };
}

export type Flow = ReturnType<typeof useConsignado>;
