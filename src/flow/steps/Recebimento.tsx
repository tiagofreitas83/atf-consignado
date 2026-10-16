import { Button, Icon, Input, Spinner } from "../../ds";
import type { Proposta } from "../../api/types";
import { formatCpf } from "../../lib/cpf";
import { horasUteisLabel } from "../../lib/format";
import { TUTORIAL_PIX } from "../content";
import { ActionBar, FieldSlot, StepColumn, StepHeading, TextButton, Tile } from "../ui";
import type { Flow } from "../useConsignado";

export function Recebimento({ flow: { state: s, actions: a, derived: d }, proposta: p }: { flow: Flow; proposta: Proposta }) {
  const validar = () => a.validarPix(p.id, d.cpfDigits);

  return (
    <StepColumn label="Recebimento">
      <StepHeading
        title="Onde você quer receber?"
        lead="O valor é enviado por Pix para a chave do seu CPF. Assim garantimos que o dinheiro cai numa conta no seu nome."
      />

      <div className="flex flex-col gap-3">
        <FieldSlot>
          <Input
            label="Chave Pix (CPF)"
            value={s.cpfPix}
            onChange={a.setCpfPix}
            mask="cpf"
            errors={d.cpfErro}
            placeholder="000.000.000-00"
            leftIcon="pix"
            autoComplete="off"
          />
        </FieldSlot>

        {/* TEMPORÁRIO (demonstração): remover antes de produção. */}
        <p className="m-0 -mt-3 text-[13px] text-neutral-40">
          Exemplo para testar: CPF da {p.trabalhador.nome.split(" ")[0]}, {formatCpf(p.trabalhador.cpf)}.{" "}
          <button type="button" className="atf-link font-semibold" onClick={() => a.setCpfPix(formatCpf(p.trabalhador.cpf))}>
            Preencher
          </button>
        </p>

        <div aria-live="polite" className="flex flex-col">
          {s.pix === "idle" && (
            <div className="flex">
              <Button variant="outline" size="md" disabled={!d.cpfDoTitular} onClick={validar}>
                Validar chave Pix
              </Button>
            </div>
          )}
          {s.pix === "loading" && (
            <Tile tone="subtle" className="flex items-center gap-3 text-sm text-neutral-40">
              <Spinner size="sm" label="Consultando" />
              <span>Consultando a instituição recebedora no diretório Pix…</span>
            </Tile>
          )}
          {s.pix === "ok" && s.pixResultado && (
            <Tile tone="success" className="flex items-start gap-3">
              <span className="flex shrink-0 text-success-40">
                <Icon name="check" size={24} />
              </span>
              <div className="flex min-w-0 flex-col gap-1 text-sm text-success-10">
                <span className="font-semibold">Chave validada</span>
                <span className="[overflow-wrap:anywhere]">
                  {s.pixResultado.instituicao.nome} ({s.pixResultado.instituicao.codigo}) · {s.pixResultado.titularMascarado}
                </span>
              </div>
            </Tile>
          )}
          {s.pix === "notfound" && (
            <Tile tone="error" className="flex flex-col gap-4 text-error-10">
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">Seu CPF ainda não é uma chave Pix</span>
                <span className="leading-normal text-pretty">
                  Cadastre o CPF como chave no app do seu banco e valide novamente. Leva menos de um minuto.
                </span>
              </div>
              <div className="flex flex-col items-start">
                <Button variant="neutral" size="sm" fullWidth onClick={validar}>
                  Já cadastrei, validar novamente
                </Button>
              </div>
            </Tile>
          )}
        </div>

        <TextButton onClick={a.toggleTutorial}>{s.tutorial ? "Ocultar passo a passo" : "Não tenho o CPF como chave Pix"}</TextButton>
        {s.tutorial && (
          <ol className="m-0 flex list-none flex-col gap-4 rounded-card border border-neutral-90 p-[clamp(16px,4vw,24px)]">
            {TUTORIAL_PIX.map((t, i) => (
              <li key={t.title} className="flex items-start gap-4">
                <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1 pt-[3px]">
                  <span className="text-[15px] font-semibold">{t.title}</span>
                  <span className="text-sm leading-normal text-neutral-40 text-pretty">{t.text}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[15px] font-semibold">Contato para acompanhar a contratação</span>
        <FieldSlot>
          <Input label="E-mail" type="email" value={s.email} onChange={a.setEmail} errors={d.emailErro} autoComplete="email" />
        </FieldSlot>
        <FieldSlot>
          <Input
            label="Celular"
            type="tel"
            value={s.phone}
            onChange={a.setPhone}
            mask="phone"
            errors={d.phoneErro}
            description="Você receberá o código de assinatura e o protocolo por SMS."
            autoComplete="tel-national"
          />
        </FieldSlot>
      </div>

      <Tile tone="amber" className="flex items-center gap-3">
        <span className="flex shrink-0">
          <Icon name="scheduleBold" size={24} />
        </span>
        <span className="text-sm leading-normal text-pretty">
          Pagamento estimado em até <strong className="font-semibold">{horasUteisLabel(p.horasUteisPagamento)}</strong> após a assinatura da CCB.
        </span>
      </Tile>

      <ActionBar
        back={
          <Button variant="text" size="md" onClick={a.back}>
            Voltar
          </Button>
        }
      >
        <Button variant="brand" size="lg" rightIcon="arrowForward" fullWidth disabled={!d.recebimentoOk} onClick={() => a.next()}>
          Seguir para assinatura
        </Button>
      </ActionBar>
    </StepColumn>
  );
}
