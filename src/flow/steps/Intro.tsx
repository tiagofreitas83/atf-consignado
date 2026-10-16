import { Button, Checkbox } from "../../ds";
import type { Flow } from "../useConsignado";

const FATOS = [
  ["513", "Código da instituição no sistema financeiro"],
  ["Bacen", "Autorizada e supervisionada pelo Banco Central"],
  ["Pix", "Dinheiro na sua conta, na chave do seu CPF"],
] as const;

export function Intro({ flow: { state: s, actions: a } }: { flow: Flow }) {
  return (
    <section aria-label="Boas-vindas" className="flex flex-col gap-[clamp(32px,6vw,48px)] pt-[clamp(0px,3vw,32px)] animate-cp-fade">
      <div className="flex max-w-[880px] flex-col gap-6">
        <h1 className="m-0 text-[clamp(34px,9vw,84px)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
          Consignado privado, direto do seu salário para a sua conta.
        </h1>
        <p className="m-0 max-w-[620px] text-[clamp(16px,3.6vw,20px)] leading-normal text-neutral-40 text-pretty">
          A ATF SCD S.A. é uma Sociedade de Crédito Direto autorizada e regulada pelo Banco Central do Brasil. Você contrata em poucos minutos e a
          parcela é descontada em folha.
        </p>
      </div>

      <dl className="m-0 grid max-w-[880px] grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-5 border-t border-neutral-90 pt-6">
        {FATOS.map(([valor, legenda]) => (
          <div key={valor} className="flex flex-col-reverse gap-1">
            <dd className="m-0 text-sm text-neutral-40">{legenda}</dd>
            <dt className="text-[32px] font-semibold tracking-[-0.02em]">{valor}</dt>
          </div>
        ))}
      </dl>

      <div className="flex max-w-[880px] flex-col gap-6">
        <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-normal text-pretty">
          <Checkbox checked={s.consent} onChange={a.setConsent} />
          <span>
            Li e aceito o{" "}
            <button type="button" className="atf-link" onClick={() => a.openDoc("termos")}>
              Termo de consentimento
            </button>{" "}
            e a{" "}
            <button type="button" className="atf-link" onClick={() => a.openDoc("privacidade")}>
              Política de privacidade
            </button>
            , incluindo a consulta dos meus dados de vínculo empregatício.
          </span>
        </label>
        <div className="flex max-w-[360px]">
          <Button
            variant="brand"
            size="lg"
            rightIcon="arrowForward"
            fullWidth
            disabled={!s.consent || s.consentEnviando}
            onClick={a.aceitarConsentimento}
          >
            Seguir
          </Button>
        </div>
      </div>
    </section>
  );
}
