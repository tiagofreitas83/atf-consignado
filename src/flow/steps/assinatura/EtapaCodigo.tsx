import { Button, Input, Spinner } from "../../../ds";
import type { Canal } from "../../../api/types";
import { celularMascarado, emailMascarado } from "../../../lib/format";
import { FieldSlot, Tile } from "../../ui";
import type { Flow } from "../../useConsignado";

const CODIGO_EXEMPLO = "123456";

/** Confirmação de e-mail ou celular por código de 6 dígitos. */
export function EtapaCodigo({ flow: { state: s, actions: a, derived: d }, propostaId, canal }: { flow: Flow; propostaId: string; canal: Canal }) {
  const v = canal === "email" ? s.emailVerif : s.smsVerif;
  const destino = canal === "email" ? emailMascarado(s.email) : celularMascarado(d.phoneDigits);
  const meio = canal === "email" ? "e-mail" : "SMS";
  const ocupado = v.status === "confirmando";

  if (v.status === "pendente") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="m-0 text-sm leading-normal text-neutral-40">
          Vamos enviar um código de 6 dígitos por {meio} para <strong className="font-semibold text-neutral-20">{destino}</strong>.
        </p>
        {v.erro && (
          <p className="m-0 text-sm text-error-10" role="alert">
            {v.erro}
          </p>
        )}
        <Button variant="brand" size="md" onClick={() => a.enviarCodigo(propostaId, canal)}>
          Enviar código
        </Button>
      </div>
    );
  }

  if (v.status === "enviando") {
    return (
      <Tile tone="subtle" className="flex items-center gap-3 text-sm text-neutral-40">
        <Spinner size="sm" label="Enviando" />
        <span>Enviando o código por {meio}…</span>
      </Tile>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm leading-normal text-neutral-40">
        Enviamos um código de 6 dígitos por {meio} para <strong className="font-semibold text-neutral-20">{destino}</strong>.
      </p>
      <FieldSlot>
        <Input
          label={canal === "email" ? "Código do e-mail" : "Código do SMS"}
          value={v.codigo}
          onChange={(c) => a.setCodigo(canal, c)}
          mask="number"
          maxLength={6}
          autoComplete="one-time-code"
          errors={v.erro ?? undefined}
          disabled={ocupado}
        />
      </FieldSlot>
      {/* TEMPORÁRIO (demonstração): remover antes de produção. */}
      <p className="m-0 -mt-3 text-[13px] text-neutral-40">
        Exemplo para testar: qualquer código de 6 dígitos, como {CODIGO_EXEMPLO}.{" "}
        <button type="button" className="atf-link font-semibold" onClick={() => a.setCodigo(canal, CODIGO_EXEMPLO)} disabled={ocupado}>
          Preencher
        </button>
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button variant="brand" size="md" disabled={v.codigo.length !== 6 || ocupado} onClick={() => a.confirmarCodigo(propostaId, canal)}>
          {ocupado ? "Confirmando…" : "Confirmar código"}
        </Button>
        <button type="button" className="atf-link text-sm font-semibold" onClick={() => a.enviarCodigo(propostaId, canal)} disabled={ocupado}>
          Reenviar código
        </button>
        <button type="button" className="atf-link text-sm" onClick={a.back} disabled={ocupado}>
          {canal === "email" ? "Alterar e-mail" : "Alterar celular"}
        </button>
      </div>
    </div>
  );
}
