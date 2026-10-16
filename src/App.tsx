import logoUrl from "./assets/logo.svg";
import type { ConsignadoApi } from "./api/types";
import { Spinner } from "./ds";
import { STEP_LABELS } from "./flow/content";
import { DocModal } from "./flow/DocModal";
import { Assinatura } from "./flow/steps/Assinatura";
import { Concluido } from "./flow/steps/Concluido";
import { Intro } from "./flow/steps/Intro";
import { Proposta } from "./flow/steps/Proposta";
import { Recebimento } from "./flow/steps/Recebimento";
import { useConsignado } from "./flow/useConsignado";

const TOTAL = STEP_LABELS.length;

export function App({ api }: { api: ConsignadoApi }) {
  const flow = useConsignado(api);
  const { state: s, actions: a } = flow;
  const p = s.proposta;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <header className="sticky top-0 z-[5] bg-neutral-100">
        <div className="mx-auto box-content flex max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-[clamp(16px,5vw,40px)] py-[clamp(16px,4vw,24px)]">
          <img src={logoUrl} alt="ATF" className="block h-auto w-[104px]" />
          <div className="flex items-center gap-3 text-[13px]">
            <span className="font-semibold text-neutral-20">{STEP_LABELS[s.step - 1]}</span>
            <span className="text-neutral-50">
              {s.step} de {TOTAL}
            </span>
          </div>
        </div>
        <div
          className="h-0.5 bg-neutral-90"
          role="progressbar"
          aria-label="Progresso da contratação"
          aria-valuemin={1}
          aria-valuemax={TOTAL}
          aria-valuenow={s.step}
        >
          <div className="h-0.5 bg-primary transition-[width] duration-[.4s] ease-[ease]" style={{ width: `${(s.step / TOTAL) * 100}%` }} />
        </div>
      </header>

      <main className="mx-auto box-border w-full max-w-[1120px] flex-1 overflow-x-hidden px-[clamp(16px,5vw,40px)] pt-[clamp(24px,5vw,40px)] pb-16">
        {s.step === 1 && <Intro flow={flow} />}
        {s.step > 1 && !p && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {p && s.step === 2 && <Proposta key="2" flow={flow} proposta={p} />}
        {p && s.step === 3 && <Recebimento key="3" flow={flow} proposta={p} />}
        {p && s.step === 4 && <Assinatura key="4" flow={flow} proposta={p} />}
        {p && s.step === 5 && <Concluido key="5" flow={flow} proposta={p} />}
      </main>

      <footer className="border-t border-neutral-90">
        <div className="mx-auto box-content flex max-w-[1120px] flex-wrap justify-between gap-3 px-[clamp(16px,5vw,40px)] py-6 text-xs leading-normal text-neutral-40">
          <span>ATF SCD S.A. · Sociedade de Crédito Direto · Instituição 513 · Autorizada pelo Banco Central do Brasil</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="https://www.atf.com.br" target="_blank" rel="noopener noreferrer" className="atf-link !text-neutral-40 hover:!text-secondary-20">
              www.atf.com.br
            </a>
            <button type="button" className="atf-link !text-neutral-40 hover:!text-secondary-20" onClick={() => a.openDoc("termos")}>
              Termos de consentimento
            </button>
            <button type="button" className="atf-link !text-neutral-40 hover:!text-secondary-20" onClick={() => a.openDoc("privacidade")}>
              Política de Privacidade
            </button>
            <button type="button" className="atf-link !text-neutral-40 hover:!text-secondary-20" onClick={() => a.openDoc("lgpd")}>
              LGPD
            </button>
          </div>
        </div>
      </footer>

      {s.doc && <DocModal doc={s.doc} onClose={a.closeDoc} />}
    </div>
  );
}
