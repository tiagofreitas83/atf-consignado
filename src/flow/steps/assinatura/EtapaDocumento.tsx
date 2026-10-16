import { useRef } from "react";
import { Button, Radio, Spinner } from "../../../ds";
import type { TipoDocumento } from "../../../api/types";
import { Tile } from "../../ui";
import type { Flow } from "../../useConsignado";

export const DOCUMENTOS: Record<TipoDocumento, { nome: string; app: string }> = {
  cnh: { nome: "CNH Digital", app: "No app CNH do Brasil, abra a sua CNH e exporte o documento em PDF." },
  cin: { nome: "Carteira de Identidade Nacional", app: "No app gov.br, entre em Carteira de documentos, abra a CIN e exporte em PDF." },
};

/** Apresentação do documento da carteira digital (PDF com QR Code assinado). */
export function EtapaDocumento({ flow: { state: s, actions: a }, propostaId }: { flow: Flow; propostaId: string }) {
  const arquivoRef = useRef<HTMLInputElement>(null);
  const doc = s.documento;
  const validando = doc.status === "validando";

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm leading-normal text-neutral-40 text-pretty">
        Use o documento oficial da sua carteira digital. O PDF exportado pelo app traz um QR Code que comprova a autenticidade.
      </p>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" disabled={validando}>
        <legend className="mb-2 p-0 text-sm font-semibold">Qual documento você vai apresentar?</legend>
        {(Object.keys(DOCUMENTOS) as TipoDocumento[]).map((tipo) => (
          <label
            key={tipo}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              doc.tipo === tipo ? "border-neutral-20" : "border-neutral-90 hover:border-neutral-80"
            }`}
          >
            <Radio name="tipo-documento" checked={doc.tipo === tipo} onChange={() => a.setTipoDocumento(tipo)} />
            <span className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold">{DOCUMENTOS[tipo].nome}</span>
              <span className="text-sm leading-normal text-neutral-40 text-pretty">{DOCUMENTOS[tipo].app}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {doc.status === "rejeitado" && (
        <Tile tone="error" className="text-sm text-error-10">
          <span role="alert">{doc.erro}</span>
        </Tile>
      )}

      {validando ? (
        <Tile tone="subtle" className="flex items-center gap-3 text-sm text-neutral-40">
          <Spinner size="sm" label="Validando" />
          <span>Validando o QR Code e a assinatura digital do documento…</span>
        </Tile>
      ) : (
        doc.tipo && (
          <div className="flex flex-col items-start gap-3">
            <input
              ref={arquivoRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              aria-label="Arquivo do documento"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) a.validarDocumento(propostaId, f);
              }}
            />
            <Button variant="brand" size="md" rightIcon="uploadFile" onClick={() => arquivoRef.current?.click()}>
              Enviar PDF do documento
            </Button>
            {/* TEMPORÁRIO (demonstração): remover antes de produção. */}
            <p className="m-0 text-[13px] text-neutral-40">
              Para testar sem o app:{" "}
              <button
                type="button"
                className="atf-link font-semibold"
                onClick={() => a.validarDocumento(propostaId, new Blob(["exemplo"], { type: "application/pdf" }))}
              >
                usar documento de exemplo
              </button>
            </p>
          </div>
        )
      )}
    </div>
  );
}
