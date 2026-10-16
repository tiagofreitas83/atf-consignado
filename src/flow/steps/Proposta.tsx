import { Button } from "../../ds";
import type { Proposta as P } from "../../api/types";
import { formatCpf } from "../../lib/cpf";
import { brl, capitalize, mesAno, primeiroNome, taxaAmAa } from "../../lib/format";
import { ActionBar, StepColumn } from "../ui";
import type { Flow } from "../useConsignado";

export function Proposta({ flow: { actions: a }, proposta: p }: { flow: Flow; proposta: P }) {
  const rows: [string, string][] = [
    ["Valor solicitado", brl(p.valor)],
    ["Prazo", `${p.prazoMeses} meses`],
    ["Taxa de juros", taxaAmAa(p.taxaMensal, p.taxaAnual)],
    ["Parcela mensal", brl(p.parcela)],
    ["IOF", brl(p.iof)],
    ["CET", taxaAmAa(p.cetMensal, p.cetAnual)],
    ["Valor total a pagar", brl(p.total)],
    ["Primeiro desconto em folha", capitalize(mesAno(p.primeiroDesconto))],
  ];

  return (
    <StepColumn label="Proposta">
      <div className="flex flex-col gap-3">
        <span className="text-sm text-neutral-40">Olá, {primeiroNome(p.trabalhador.nome)}. Esta é a sua proposta.</span>
        <h1 className="m-0 text-[clamp(30px,8vw,56px)] leading-[1.05] font-semibold tracking-[-0.03em]">{brl(p.valor)}</h1>
        <span className="text-base text-neutral-40">
          em {p.prazoMeses} parcelas de <strong className="font-semibold text-neutral-20">{brl(p.parcela)}</strong>, descontadas em folha
        </span>
      </div>

      <dl className="m-0 rounded-card border border-neutral-90 px-[clamp(16px,4vw,24px)] pt-[clamp(16px,4vw,24px)] pb-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-neutral-90 py-3 last:border-b-0">
            <dt className="min-w-0 text-sm text-neutral-40">{label}</dt>
            <dd className="m-0 ml-auto text-right text-[15px] font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="m-0 text-[13px] leading-[1.6] text-neutral-40 text-pretty">
        Solicitação feita por {p.trabalhador.nome}, CPF {formatCpf(p.trabalhador.cpf)}, vinculado a {p.empregador.razaoSocial}. A parcela respeita
        a sua margem consignável e é repassada pelo empregador à ATF.
      </p>

      <ActionBar
        back={
          <Button variant="text" size="md" onClick={a.back}>
            Voltar
          </Button>
        }
      >
        <Button variant="brand" size="lg" rightIcon="arrowForward" fullWidth onClick={a.confirmarProposta}>
          Confirmar proposta
        </Button>
      </ActionBar>
    </StepColumn>
  );
}
