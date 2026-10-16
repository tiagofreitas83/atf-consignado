import { Button, Input, Spinner } from "../../../ds";
import type { Canal } from "../../../api/types";
import { celularMascarado, emailMascarado } from "../../../lib/format";
import { FieldSlot, LinkRow, TextButton, Tile } from "../../ui";
import type { Flow } from "../../useConsignado";

const CODIGO_EXEMPLO = "123456";

/**
 * Confirmação de e-mail ou celular: a pessoa confere (ou corrige) o contato
 * vindo da proposta, recebe um código de 6 dígitos e o digita.
 */
export function EtapaCodigo({ flow: { state: s, actions: a, derived: d }, propostaId, canal }: { flow: Flow; propostaId: string; canal: Canal }) {
  const ehEmail = canal === "email";
  const v = ehEmail ? s.emailVerif : s.smsVerif;
  const destino = ehEmail ? emailMascarado(s.email) : celularMascarado(d.phoneDigits);
  const meio = ehEmail ? "e-mail" : "SMS";
  const ocupado = v.status === "confirmando";

  if (v.status === "pendente") {
    const contatoOk = ehEmail ? d.emailOk : d.phoneOk;
    return (
      <div className="flex flex-col gap-3">
        <p className="m-0 text-sm leading-normal text-neutral-40 text-pretty">
          {ehEmail
            ? "Confira o seu e-mail. Vamos enviar um código de 6 dígitos para ele, e é nele que você recebe a CCB assinada."
            : "Confira o seu celular. Vamos enviar um código de 6 dígitos por SMS, e é nele que você recebe o protocolo."}
        </p>
        <FieldSlot>
          {ehEmail ? (
            <Input label="E-mail" type="email" value={s.email} onChange={a.setEmail} errors={d.emailErro} autoComplete="email" />
          ) : (
            <Input label="Celular" type="tel" value={s.phone} onChange={a.setPhone} mask="phone" errors={d.phoneErro} autoComplete="tel-national" />
          )}
        </FieldSlot>
        {v.erro && (
          <p className="m-0 text-sm text-error-10" role="alert">
            {v.erro}
          </p>
        )}
        <div className="flex">
          <Button variant="brand" size="md" className="w-full sm:w-auto" disabled={!contatoOk} onClick={() => a.enviarCodigo(propostaId, canal)}>
            Enviar código
          </Button>
        </div>
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
      <p className="m-0 text-sm leading-normal text-neutral-40 text-pretty">
        Enviamos um código de 6 dígitos por {meio} para <strong className="font-semibold text-neutral-20 [overflow-wrap:anywhere]">{destino}</strong>.
      </p>
      <FieldSlot>
        <Input
          label={ehEmail ? "Código do e-mail" : "Código do SMS"}
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
      <p className="m-0 -mt-3 text-[13px] leading-normal text-neutral-40">
        Exemplo para testar: qualquer código de 6 dígitos, como {CODIGO_EXEMPLO}.{" "}
        <button type="button" className="atf-link font-semibold" onClick={() => a.setCodigo(canal, CODIGO_EXEMPLO)} disabled={ocupado}>
          Preencher
        </button>
      </p>
      <div className="flex">
        <Button
          variant="brand"
          size="md"
          className="w-full sm:w-auto"
          disabled={v.codigo.length !== 6 || ocupado}
          onClick={() => a.confirmarCodigo(propostaId, canal)}
        >
          {ocupado ? "Confirmando…" : "Confirmar código"}
        </Button>
      </div>
      <LinkRow>
        <TextButton onClick={() => a.enviarCodigo(propostaId, canal)} disabled={ocupado}>
          Reenviar código
        </TextButton>
        <TextButton onClick={() => a.alterarContato(canal)} disabled={ocupado}>
          {ehEmail ? "Alterar e\u2011mail" : "Alterar celular"}
        </TextButton>
      </LinkRow>
    </div>
  );
}
