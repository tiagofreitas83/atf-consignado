import { useState } from "react";
import { Button, Spinner } from "../../../ds";
import { Tile } from "../../ui";
import type { Flow } from "../../useConsignado";
import { FaceCapture } from "./FaceCapture";

const DICAS = ["Fique num lugar bem iluminado", "Tire óculos, boné ou máscara", "Segure o celular na altura do rosto"];

export function EtapaBiometria({ flow: { state: s, actions: a }, propostaId }: { flow: Flow; propostaId: string }) {
  const [capturando, setCapturando] = useState(false);

  if (s.biometria === "enviando") {
    return (
      <Tile tone="subtle" className="flex items-center gap-3 text-sm text-neutral-40">
        <Spinner size="sm" label="Analisando" />
        <span>Comparando o seu rosto com a foto do documento…</span>
      </Tile>
    );
  }

  if (capturando) {
    return (
      <FaceCapture
        onCaptura={(frame) => {
          setCapturando(false);
          a.enviarBiometria(propostaId, frame);
        }}
        onCancelar={() => setCapturando(false)}
      />
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="m-0 text-sm leading-normal text-neutral-40 text-pretty">
        Vamos confirmar que é você quem está contratando. Leva poucos segundos: centralize o rosto no oval e, quando pedirmos, aproxime a câmera.
      </p>
      <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-sm leading-normal">
        {DICAS.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      {s.biometria === "falhou" && (
        <Tile tone="error" className="w-full text-sm text-error-10">
          <span role="alert">{s.biometriaErro}</span>
        </Tile>
      )}
      <Button variant="brand" size="md" rightIcon="photoCamera" onClick={() => setCapturando(true)}>
        {s.biometria === "falhou" ? "Tentar novamente" : "Iniciar reconhecimento"}
      </Button>
    </div>
  );
}
