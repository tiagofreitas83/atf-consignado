import { Button, Checkbox } from "../../../ds";
import type { Proposta } from "../../../api/types";
import { formatCpf } from "../../../lib/cpf";
import { brl, mesAno, pct } from "../../../lib/format";
import type { Flow } from "../../useConsignado";

export function EtapaCcb({ flow: { state: s, actions: a }, proposta: p }: { flow: Flow; proposta: Proposta }) {
  const banco = s.pixResultado ? `${s.pixResultado.instituicao.nome} (${s.pixResultado.instituicao.codigo})` : "";
  const clausulas = [
    ["Partes", `Emitente: ${p.trabalhador.nome}, CPF ${formatCpf(p.trabalhador.cpf)}. Credora: ATF SCD S.A., instituição 513.`],
    ["Valor e liberação", `${brl(p.valor)} creditados via Pix na chave CPF da emitente, em ${banco}.`],
    [
      "Encargos",
      `Taxa de ${pct(p.taxaMensal)} a.m. (${pct(p.taxaAnual)} a.a.), CET de ${pct(p.cetMensal)} a.m. (${pct(p.cetAnual)} a.a.) e IOF de ${brl(p.iof)}.`,
    ],
    [
      "Pagamento",
      `${p.prazoMeses} parcelas mensais de ${brl(p.parcela)}, descontadas em folha por ${p.empregador.razaoSocial}, a partir de ${mesAno(p.primeiroDesconto)}.`,
    ],
    [
      "Rescisão do vínculo",
      "Em caso de desligamento, o saldo devedor poderá ser abatido das verbas rescisórias, nos limites da lei, e o restante seguirá em boleto.",
    ],
    ["Liquidação antecipada", "Você pode quitar a qualquer momento, com redução proporcional dos juros."],
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-card border border-neutral-90">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-neutral-95 px-[clamp(16px,4vw,24px)] py-4">
          <span className="text-sm font-semibold">CCB nº {p.ccb.numero}</span>
          {/* TODO: destino do documento completo ainda não definido pelo produto. */}
          <button type="button" className="atf-link -my-3 inline-flex min-h-11 items-center text-[13px] font-semibold">
            Ler documento completo
          </button>
        </div>
        <div tabIndex={0} aria-label="Cláusulas da CCB" className="flex max-h-[280px] flex-col gap-4 overflow-y-auto p-[clamp(16px,4vw,24px)]">
          {clausulas.map(([title, text]) => (
            <div key={title} className="flex flex-col gap-1">
              <span className="text-xs font-bold tracking-[.06em] text-neutral-40 uppercase">{title}</span>
              <span className="text-sm leading-[1.6] text-pretty">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-normal">
        <Checkbox checked={s.ccbAceite} onChange={a.setCcbAceite} />
        <span>Li a CCB e concordo com as condições de valor, taxa, prazo e desconto em folha.</span>
      </label>

      <div className="flex">
        <Button variant="brand" size="md" rightIcon="arrowForward" className="w-full sm:w-auto" disabled={!s.ccbAceite} onClick={a.continuarCcb}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
