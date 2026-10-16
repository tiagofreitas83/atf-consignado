import { useEffect, useRef, type ReactNode } from "react";
import { Button, Icon } from "../../ds";
import type { Proposta } from "../../api/types";
import { celularMascarado, emailMascarado } from "../../lib/format";
import { ActionBar, StepColumn, StepHeading, Tile } from "../ui";
import { ETAPAS_ASSINATURA, type EtapaAssinatura, type Flow } from "../useConsignado";
import { EtapaBiometria } from "./assinatura/EtapaBiometria";
import { EtapaCcb } from "./assinatura/EtapaCcb";
import { EtapaCodigo } from "./assinatura/EtapaCodigo";
import { DOCUMENTOS, EtapaDocumento } from "./assinatura/EtapaDocumento";

const TITULOS: Record<EtapaAssinatura, string> = {
  ccb: "Revise e aceite a CCB",
  email: "Confirme o seu e-mail",
  sms: "Confirme o seu celular",
  documento: "Apresente o seu documento digital",
  biometria: "Faça o reconhecimento facial",
};

export function Assinatura({ flow, proposta: p }: { flow: Flow; proposta: Proposta }) {
  const { state: s, actions: a, derived: d } = flow;
  const atual = d.etapaAtual;

  const resumo: Record<EtapaAssinatura, string> = {
    ccb: `CCB nº ${p.ccb.numero} lida e aceita`,
    email: `${emailMascarado(s.email)} confirmado`,
    sms: `${celularMascarado(d.phoneDigits)} confirmado`,
    documento: s.documento.tipo ? `${DOCUMENTOS[s.documento.tipo].nome} validada` : "",
    biometria: "Prova de vida concluída",
  };

  const painel: Record<EtapaAssinatura, ReactNode> = {
    ccb: <EtapaCcb flow={flow} proposta={p} />,
    email: <EtapaCodigo flow={flow} propostaId={p.id} canal="email" />,
    sms: <EtapaCodigo flow={flow} propostaId={p.id} canal="sms" />,
    documento: <EtapaDocumento flow={flow} propostaId={p.id} />,
    biometria: <EtapaBiometria flow={flow} propostaId={p.id} />,
  };

  // Ao concluir uma etapa, traz a próxima para a vista.
  const rowRefs = useRef<Partial<Record<EtapaAssinatura, HTMLLIElement | null>>>({});
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    if (atual) rowRefs.current[atual]?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [atual]);

  return (
    <StepColumn label="Assinatura">
      <StepHeading
        title="Assine a sua Cédula de Crédito Bancário"
        lead="Para a sua segurança, a assinatura confirma que é você: revise a CCB, confirme e-mail e celular, apresente o seu documento digital e faça o reconhecimento facial."
      />

      <ol className="m-0 list-none rounded-card border border-neutral-90 px-[clamp(16px,4vw,24px)] py-2">
        {ETAPAS_ASSINATURA.map((etapa, i) => {
          const feita = d.concluidas[etapa];
          const ativa = etapa === atual;
          return (
            <li
              key={etapa}
              ref={(el) => {
                rowRefs.current[etapa] = el;
              }}
              aria-current={ativa ? "step" : undefined}
              className="scroll-mt-24 border-b border-neutral-90 py-4 last:border-b-0"
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                    feita ? "bg-success-40 text-neutral-100" : ativa ? "bg-primary" : "bg-neutral-95 text-neutral-50"
                  }`}
                >
                  {feita ? <Icon name="doneBold" size={18} /> : i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1 pt-[3px]">
                  <span className={`text-[15px] font-semibold ${!feita && !ativa ? "text-neutral-50" : ""}`}>
                    {TITULOS[etapa]}
                    <span className="sr-only">{feita ? " — concluída" : ativa ? " — etapa atual" : " — pendente"}</span>
                  </span>
                  {feita && <span className="text-sm text-neutral-40 [overflow-wrap:anywhere]">{resumo[etapa]}</span>}
                </div>
              </div>
              {ativa && <div className="mt-4 sm:pl-11">{painel[etapa]}</div>}
            </li>
          );
        })}
      </ol>

      {!atual && (
        <Tile tone="success" className="flex items-start gap-3">
          <span className="flex shrink-0 text-success-40">
            <Icon name="check" size={24} />
          </span>
          <span className="text-sm leading-normal text-success-10">
            <strong className="font-semibold">Identidade confirmada.</strong> Tudo pronto para assinar a CCB.
          </span>
        </Tile>
      )}

      {s.assinaturaErro && (
        <p className="m-0 text-sm text-error-10" role="alert">
          {s.assinaturaErro}
        </p>
      )}

      <ActionBar
        back={
          <Button variant="text" size="md" onClick={a.back} disabled={s.signing}>
            Voltar
          </Button>
        }
      >
        <Button variant="brand" size="lg" rightIcon="doneBold" fullWidth disabled={Boolean(atual) || s.signing} onClick={() => a.assinar(p.id)}>
          {s.signing ? "Assinando…" : "Assinar CCB"}
        </Button>
      </ActionBar>
    </StepColumn>
  );
}
