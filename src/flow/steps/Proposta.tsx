import { Button, Icon, Input } from "../../ds";
import type { Proposta as P } from "../../api/types";
import { brl, capitalize, mesAno, primeiroNome, taxaAmAa } from "../../lib/format";
import { ActionBar, FieldSlot, StepColumn, StepHeading, Tile } from "../ui";
import type { Flow } from "../useConsignado";

const CPF_EXEMPLO = "123.456.789-09";

/** Passo 2: o CPF confere com o link e só então a proposta aparece. */
export function Proposta({ flow }: { flow: Flow }) {
  return flow.state.proposta ? <DetalheProposta flow={flow} proposta={flow.state.proposta} /> : <ConfirmarCpf flow={flow} />;
}

function ConfirmarCpf({ flow: { state: s, actions: a, derived: d } }: { flow: Flow }) {
  const bloqueado = s.cpfBloqueado;
  const podeVerificar = d.cpfInputOk && !s.cpfVerificando && !bloqueado;

  return (
    <StepColumn label="Confirme o seu CPF">
      <StepHeading
        title="Confirme o seu CPF"
        lead="Por segurança, os dados da sua proposta só aparecem depois que você confirma o CPF de quem vai contratar."
      />

      {bloqueado ? (
        <Tile tone="error" className="flex flex-col gap-1 text-sm text-error-10" >
          <span className="font-semibold" role="alert">
            Bloqueamos este link por segurança
          </span>
          <span className="leading-normal text-pretty">
            O CPF não conferiu depois de várias tentativas. Peça um novo link ao RH da sua empresa ou fale com a ATF.
          </span>
        </Tile>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (podeVerificar) a.verificarCpf();
          }}
        >
          <FieldSlot>
            <Input
              label="CPF"
              value={s.cpfInput}
              onChange={a.setCpfInput}
              mask="cpf"
              placeholder="000.000.000-00"
              errors={d.cpfInputErro ?? s.cpfErroApi ?? undefined}
              disabled={s.cpfVerificando}
              autoComplete="off"
              autoFocus
            />
          </FieldSlot>
          {/* TEMPORÁRIO (demonstração): remover antes de produção. */}
          <p className="m-0 text-[13px] leading-normal text-neutral-40">
            CPF de exemplo para testar: {CPF_EXEMPLO}.{" "}
            <button type="button" className="atf-link font-semibold" onClick={() => a.setCpfInput(CPF_EXEMPLO)} disabled={s.cpfVerificando}>
              Preencher
            </button>
          </p>
          <div className="flex items-start gap-3 text-sm leading-normal text-neutral-40">
            <span className="flex shrink-0 pt-px" aria-hidden="true">
              <Icon name="shieldPerson" size={20} />
            </span>
            <span className="text-pretty">O link é pessoal. Se o CPF não conferir algumas vezes, ele é bloqueado.</span>
          </div>
        </form>
      )}

      <ActionBar
        back={
          <Button variant="text" size="md" onClick={a.back} disabled={s.cpfVerificando}>
            Voltar
          </Button>
        }
      >
        {!bloqueado && (
          <Button variant="brand" size="lg" rightIcon="arrowForward" fullWidth disabled={!podeVerificar} onClick={a.verificarCpf}>
            {s.cpfVerificando ? "Verificando…" : "Ver minha proposta"}
          </Button>
        )}
      </ActionBar>
    </StepColumn>
  );
}

function DetalheProposta({ flow: { actions: a }, proposta: p }: { flow: Flow; proposta: P }) {
  const rows: [string, string][] = [
    ["Empresa", p.empregador.razaoSocial],
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

      <ActionBar
        back={
          <Button variant="text" size="md" onClick={a.back}>
            Voltar
          </Button>
        }
      >
        <Button variant="brand" size="lg" rightIcon="arrowForward" fullWidth onClick={() => a.confirmarProposta(p.id)}>
          Confirmar proposta
        </Button>
      </ActionBar>
    </StepColumn>
  );
}
