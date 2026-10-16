import { Button, Checkbox, Input } from "../../ds";
import type { Proposta } from "../../api/types";
import { formatCpf } from "../../lib/cpf";
import { brl, celularMascarado, mesAno, pct } from "../../lib/format";
import { ActionBar, FieldSlot, StepColumn, StepHeading, TextButton } from "../ui";
import type { Flow } from "../useConsignado";

export function Assinatura({ flow: { state: s, actions: a, derived: d }, proposta: p }: { flow: Flow; proposta: Proposta }) {
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
    <StepColumn label="Assinatura">
      <StepHeading
        title="Assine a sua Cédula de Crédito Bancário"
        lead="A CCB é o contrato do seu empréstimo. Revise os pontos principais e assine com o código enviado ao seu celular."
      />

      <div className="overflow-hidden rounded-card border border-neutral-90">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-neutral-95 px-[clamp(16px,4vw,24px)] py-4">
          <span className="text-sm font-semibold">CCB nº {p.ccb.numero}</span>
          {/* TODO: destino do documento completo ainda não definido pelo produto. */}
          <button type="button" className="atf-link text-[13px] font-semibold">
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
        <Checkbox checked={s.ccbAceite} onChange={a.setCcbAceite} disabled={s.signing} />
        <span>Li a CCB e concordo com as condições de valor, taxa, prazo e desconto em folha.</span>
      </label>

      {s.otpSent && (
        <div className="flex flex-col gap-3">
          <FieldSlot>
            <Input
              label="Código de 6 dígitos"
              value={s.otp}
              onChange={a.setOtp}
              mask="number"
              maxLength={6}
              autoComplete="one-time-code"
              errors={s.otpErro ?? undefined}
              description={`Enviado por SMS para ${celularMascarado(d.phoneDigits)}`}
              disabled={s.signing}
            />
          </FieldSlot>
          <TextButton onClick={() => a.enviarOtp(p.id)}>Reenviar código</TextButton>
        </div>
      )}

      <ActionBar
        back={
          <Button variant="text" size="md" onClick={a.back} disabled={s.signing}>
            Voltar
          </Button>
        }
      >
        {s.otpSent ? (
          <Button
            variant="brand"
            size="lg"
            rightIcon="doneBold"
            fullWidth
            disabled={!s.ccbAceite || s.otp.length !== 6 || s.signing}
            onClick={() => a.assinar(p.id)}
          >
            {s.signing ? "Assinando…" : "Assinar CCB"}
          </Button>
        ) : (
          <Button
            variant="brand"
            size="lg"
            rightIcon="arrowForward"
            fullWidth
            disabled={!s.ccbAceite || s.otpEnviando}
            onClick={() => a.enviarOtp(p.id)}
          >
            Enviar código por SMS
          </Button>
        )}
      </ActionBar>
    </StepColumn>
  );
}
