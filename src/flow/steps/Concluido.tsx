import { useEffect, useState } from "react";
import { Button, Icon, type IconName } from "../../ds";
import type { Proposta } from "../../api/types";
import { banco, brl, horasUteisLabel, primeiroNome } from "../../lib/format";
import type { Flow } from "../useConsignado";

function CheckAnimado() {
  return (
    <div className="relative size-28" aria-hidden="true">
      <span className="cp-check-ring absolute inset-0 rounded-full bg-success-50 [animation:cpRing_.9s_.35s_ease-out_both]" />
      <svg width="112" height="112" viewBox="0 0 112 112" className="relative block overflow-visible">
        <circle cx="56" cy="56" r="56" className="fill-success-40 [transform-origin:56px_56px] [animation:cpPop_.5s_cubic-bezier(.2,.9,.3,1.3)_both]" />
        <path
          d="M34 58 L49 73 L79 41"
          fill="none"
          stroke="#ffffff"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="70"
          strokeDashoffset="70"
          className="cp-check-path [animation:cpDraw_.4s_.45s_ease-out_forwards]"
        />
      </svg>
    </div>
  );
}

export function Concluido({ flow: { state: s, derived: d }, proposta: p }: { flow: Flow; proposta: Proposta }) {
  const protocolo = s.assinatura?.protocolo ?? "";
  const [copiado, setCopiado] = useState(false);
  useEffect(() => {
    if (!copiado) return;
    const t = window.setTimeout(() => setCopiado(false), 2000);
    return () => window.clearTimeout(t);
  }, [copiado]);
  const copiar = () => navigator.clipboard?.writeText(protocolo).then(() => setCopiado(true), () => {});
  const horas = horasUteisLabel(p.horasUteisPagamento);
  const destinoBanco = d.pixDestino ? banco(d.pixDestino.instituicao) : "";
  const envios: { icon: IconName; title: string; text: string }[] = [
    { icon: "chat", title: "SMS enviado", text: `Para ${s.phone}, com o protocolo e o link para acompanhar a contratação.` },
    { icon: "mail", title: "CCB assinada no seu e\u2011mail", text: `Enviamos a cédula em PDF para ${s.email}.` },
    { icon: "pix", title: `Pix em até ${horas}`, text: "Avisamos assim que o valor for creditado na sua conta." },
  ];

  return (
    <section aria-label="Concluído" className="mx-auto flex max-w-[640px] flex-col items-center gap-8 pt-6 text-center">
      <div className="flex size-[120px] items-center justify-center">
        <CheckAnimado />
      </div>

      <div className="flex flex-col items-center gap-3 [animation:cpFade_.5s_.7s_ease_both]">
        <h1 className="m-0 text-[clamp(30px,8vw,56px)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
          Pronto, {primeiroNome(p.trabalhador.nome)}! Contratação concluída.
        </h1>
        <p className="m-0 text-[17px] leading-normal text-neutral-40 text-pretty">
          {brl(p.valor)} serão enviados por Pix para {destinoBanco} em até {horas}.
        </p>
      </div>

      <div className="box-border flex w-full flex-col items-center gap-1 rounded-card bg-secondary-90 p-[clamp(16px,4vw,24px)] pb-3 [animation:cpFade_.5s_.85s_ease_both]">
        <span className="text-[13px] text-neutral-40">Número do protocolo</span>
        <span className="text-[clamp(19px,6vw,28px)] font-semibold tracking-[.02em] whitespace-nowrap">{protocolo}</span>
        <button
          type="button"
          onClick={copiar}
          aria-label={copiado ? "Protocolo copiado" : "Copiar protocolo"}
          className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors hover:bg-[#ffefd5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-20 active:bg-[#ffefd5]"
        >
          <Icon name={copiado ? "check" : "copy"} size={20} />
          {copiado ? "Copiado" : "Copiar"}
        </button>
        <span aria-live="polite" className="sr-only">
          {copiado ? "Protocolo copiado" : ""}
        </span>
      </div>

      <ul className="m-0 box-border w-full list-none rounded-card border border-neutral-90 px-[clamp(16px,4vw,24px)] pt-[clamp(16px,4vw,24px)] pb-3 text-left [animation:cpFade_.5s_1s_ease_both]">
        {envios.map((e) => (
          <li key={e.icon} className="flex items-start gap-4 border-b border-neutral-90 py-3 last:border-b-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-95">
              <Icon name={e.icon} size={22} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[15px] font-semibold">{e.title}</span>
              <span className="text-sm leading-normal text-neutral-40 text-pretty [overflow-wrap:anywhere]">{e.text}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* TODO: destino de "Ver CCB assinada" (assinatura.ccbUrl) pendente de produto. */}
      <div className="w-full [animation:cpFade_.5s_1.1s_ease_both]">
        <Button variant="outline" size="lg" rightIcon="download" fullWidth>
          Ver CCB assinada
        </Button>
      </div>
    </section>
  );
}
