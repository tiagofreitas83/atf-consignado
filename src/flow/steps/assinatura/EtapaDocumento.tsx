import { useRef, useState } from "react";
import { Button, Spinner, type IconName } from "../../../ds";
import type { OrigemDocumento, TipoDocumento } from "../../../api/types";
import { Opcao, Tile } from "../../ui";
import type { Flow } from "../../useConsignado";
import { DocumentCapture } from "./DocumentCapture";

export const DOCUMENTOS: Record<TipoDocumento, { nome: string; detalhe: string; app: string }> = {
  cnh: {
    nome: "CNH",
    detalhe: "Carteira de motorista, física ou digital.",
    app: "No app CNH do Brasil, abra a sua CNH e exporte o documento em PDF.",
  },
  rg: {
    nome: "RG",
    detalhe: "Carteira de identidade, o RG antigo ou a nova CIN.",
    app: "No app gov.br, entre em Carteira de documentos, abra a Carteira de Identidade e exporte em PDF. Só vale para a nova CIN — para o RG antigo, fotografe o documento.",
  },
};

const ORIGENS: Record<OrigemDocumento, { nome: string; detalhe: string; icon: IconName }> = {
  foto: { nome: "Fotografar o documento", detalhe: "Tire foto da frente e do verso com a câmera.", icon: "photoCamera" },
  pdf: { nome: "Enviar PDF da carteira digital", detalhe: "Use o arquivo exportado pelo app oficial.", icon: "uploadFile" },
};

export const resumoDocumento = (tipo: TipoDocumento | null, origem: OrigemDocumento | null) =>
  tipo ? `${DOCUMENTOS[tipo].nome} validado${origem === "pdf" ? " pela carteira digital" : origem === "foto" ? " por foto" : ""}` : "";

/** Documento de identidade: CNH ou RG, enviado como PDF da carteira digital ou fotografado. */
export function EtapaDocumento({ flow: { state: s, actions: a }, propostaId }: { flow: Flow; propostaId: string }) {
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [capturando, setCapturando] = useState(false);
  const doc = s.documento;
  const validando = doc.status === "validando";

  if (capturando && doc.tipo) {
    return (
      <DocumentCapture
        tipo={doc.tipo}
        onCancelar={() => setCapturando(false)}
        onConcluir={(fotos) => {
          setCapturando(false);
          a.validarDocumento(propostaId, fotos);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" disabled={validando}>
        <legend className="mb-2 p-0 text-sm font-semibold">Qual documento você vai apresentar?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(DOCUMENTOS) as TipoDocumento[]).map((tipo) => (
            <Opcao
              key={tipo}
              name="tipo-documento"
              checked={doc.tipo === tipo}
              onChange={() => a.setTipoDocumento(tipo)}
              titulo={DOCUMENTOS[tipo].nome}
              detalhe={DOCUMENTOS[tipo].detalhe}
            />
          ))}
        </div>
      </fieldset>

      {doc.tipo && (
        <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" disabled={validando}>
          <legend className="mb-2 p-0 text-sm font-semibold">Como você quer enviar?</legend>
          {(Object.keys(ORIGENS) as OrigemDocumento[]).map((origem) => (
            <Opcao
              key={origem}
              name="origem-documento"
              checked={doc.origem === origem}
              onChange={() => a.setOrigemDocumento(origem)}
              titulo={ORIGENS[origem].nome}
              detalhe={ORIGENS[origem].detalhe}
              icon={ORIGENS[origem].icon}
            />
          ))}
        </fieldset>
      )}

      {doc.status === "rejeitado" && (
        <Tile tone="error" className="text-sm text-error-10">
          <span role="alert">{doc.erro}</span>
        </Tile>
      )}

      {validando ? (
        <Tile tone="subtle" className="flex items-center gap-3 text-sm text-neutral-40">
          <Spinner size="sm" label="Validando" />
          <span>{doc.origem === "pdf" ? "Validando o QR Code e a assinatura digital do documento…" : "Conferindo a autenticidade e os dados do documento…"}</span>
        </Tile>
      ) : (
        doc.tipo &&
        doc.origem && (
          <div className="flex flex-col items-stretch gap-3 sm:items-start">
            {doc.origem === "foto" ? (
              <Button variant="brand" size="md" rightIcon="photoCamera" className="w-full sm:w-auto" onClick={() => setCapturando(true)}>
                Abrir câmera
              </Button>
            ) : (
              <>
                <p className="m-0 text-sm leading-normal text-neutral-40 text-pretty">{DOCUMENTOS[doc.tipo].app}</p>
                <input
                  ref={arquivoRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  aria-label="Arquivo PDF do documento"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) a.validarDocumento(propostaId, [f]);
                  }}
                />
                <Button variant="brand" size="md" rightIcon="uploadFile" className="w-full sm:w-auto" onClick={() => arquivoRef.current?.click()}>
                  Enviar PDF do documento
                </Button>
                {/* TEMPORÁRIO (demonstração): remover antes de produção. */}
                <p className="m-0 text-[13px] text-neutral-40">
                  Para testar sem o app:{" "}
                  <button
                    type="button"
                    className="atf-link font-semibold"
                    onClick={() => a.validarDocumento(propostaId, [new Blob(["exemplo"], { type: "application/pdf" })])}
                  >
                    usar documento de exemplo
                  </button>
                </p>
              </>
            )}
          </div>
        )
      )}
    </div>
  );
}
