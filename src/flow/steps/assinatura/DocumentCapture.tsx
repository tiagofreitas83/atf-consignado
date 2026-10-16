import { useEffect, useRef, useState } from "react";
import { Button, Icon } from "../../../ds";
import type { TipoDocumento } from "../../../api/types";
import { TextButton } from "../../ui";
import { useCamera } from "./useCamera";

const LADOS = ["frente", "verso"] as const;
type Lado = (typeof LADOS)[number];

/** Com artigo: "da CNH", "do RG". */
const DO_DOCUMENTO: Record<TipoDocumento, string> = { cnh: "da CNH", rg: "do RG" };

type Foto = { blob: Blob; url: string | null };

const urlDe = (blob: Blob) => (typeof URL.createObjectURL === "function" ? URL.createObjectURL(blob) : null);

/**
 * Digitalização do documento físico: câmera traseira com moldura no formato do
 * cartão (ID-1, 85,6 × 54 mm), foto da frente e do verso, cada uma com prévia
 * para confirmar ou refazer. Sem câmera, dá para escolher as fotos da galeria.
 */
export function DocumentCapture({ tipo, onConcluir, onCancelar }: { tipo: TipoDocumento; onConcluir: (fotos: Blob[]) => void; onCancelar: () => void }) {
  const [lado, setLado] = useState<Lado>("frente");
  const [fotos, setFotos] = useState<Partial<Record<Lado, Foto>>>({});
  const [simulado, setSimulado] = useState(false);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const atual = fotos[lado];
  const cam = useCamera("environment", !simulado && !atual);

  // Libera as prévias ao sair.
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  useEffect(() => () => Object.values(fotosRef.current).forEach((f) => f?.url && URL.revokeObjectURL(f.url)), []);

  const guardar = (blob: Blob) => setFotos((f) => ({ ...f, [lado]: { blob, url: urlDe(blob) } }));

  const tirarFoto = async () => {
    if (simulado) return guardar(new Blob([`simulado-${lado}`], { type: "image/jpeg" }));
    const blob = await cam.capturar();
    if (blob) guardar(blob);
  };

  const refazer = () => {
    if (atual?.url) URL.revokeObjectURL(atual.url);
    setFotos((f) => ({ ...f, [lado]: undefined }));
  };

  const usar = () => {
    if (lado === "frente") return setLado("verso");
    cam.parar();
    onConcluir(LADOS.map((l) => fotos[l]!.blob));
  };

  const ladoLabel = lado === "frente" ? "a frente" : "o verso";
  const ladoDe = lado === "frente" ? "da frente" : "do verso";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Frente / verso */}
      <ol className="m-0 flex list-none gap-2 p-0" aria-label="Lados do documento">
        {LADOS.map((l) => {
          const feito = l === "frente" && lado === "verso";
          return (
            <li
              key={l}
              aria-current={l === lado ? "step" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${
                l === lado ? "bg-primary" : feito ? "bg-success-90 text-success-10" : "bg-neutral-95 text-neutral-50"
              }`}
            >
              {feito && <Icon name="doneBold" size={14} />}
              {l === "frente" ? "Frente" : "Verso"}
            </li>
          );
        })}
      </ol>

      <div className="relative aspect-[4/3] w-[min(100%,480px,66dvh)] overflow-hidden rounded-card bg-neutral-10">
        {atual ? (
          atual.url ? (
            <img src={atual.url} alt={`Foto ${ladoDe} do documento`} className="absolute inset-0 size-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-80">
              <Icon name="check" size={40} />
              <span className="text-sm">Foto simulada</span>
            </div>
          )
        ) : (
          <>
            {simulado ? (
              <div className="absolute inset-0 bg-neutral-20" aria-hidden="true" />
            ) : (
              <video ref={cam.videoRef} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" />
            )}
            <Moldura />
            {cam.status === "abrindo" && !simulado && (
              <span className="absolute inset-x-0 bottom-3 text-center text-[13px] text-neutral-100">Abrindo a câmera…</span>
            )}
          </>
        )}
      </div>

      <p aria-live="polite" className="m-0 max-w-[480px] text-center text-base leading-snug font-semibold text-balance">
        {atual
          ? `Confira ${ladoLabel}: os dados estão nítidos e sem reflexo?`
          : `Encaixe ${ladoLabel} ${DO_DOCUMENTO[tipo]} na moldura`}
      </p>
      {!atual && <p className="-mt-2 m-0 text-center text-sm text-neutral-40">Use uma superfície lisa, com boa luz e sem dedos sobre o documento.</p>}

      <input
        ref={galeriaRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label={`Foto ${ladoDe} do documento`}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) guardar(f);
        }}
      />

      <div className="flex w-full max-w-[480px] flex-col items-stretch gap-1">
        {atual ? (
          <>
            <Button variant="brand" size="lg" fullWidth rightIcon={lado === "frente" ? "arrowForward" : "doneBold"} onClick={usar}>
              {lado === "frente" ? "Usar foto e fotografar o verso" : "Usar foto e enviar"}
            </Button>
            <div className="flex justify-center">
              <TextButton onClick={refazer}>Tirar outra foto</TextButton>
            </div>
          </>
        ) : cam.status === "erro" && !simulado ? (
          <div className="flex flex-col gap-3 rounded-xl bg-error-90 p-4 text-sm text-error-10">
            <span>
              <strong className="font-semibold">Não conseguimos abrir a câmera.</strong> Permita o acesso nas configurações do navegador ou escolha uma foto
              do documento.
            </span>
            <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
              <Button variant="neutral" size="sm" onClick={cam.tentarDeNovo}>
                Tentar novamente
              </Button>
              <TextButton onClick={() => galeriaRef.current?.click()}>Escolher foto</TextButton>
              {/* TEMPORÁRIO (demonstração): remover antes de produção. */}
              <TextButton onClick={() => setSimulado(true)}>Simular sem câmera</TextButton>
            </div>
          </div>
        ) : (
          <>
            <Button
              variant="brand"
              size="lg"
              fullWidth
              rightIcon="photoCamera"
              disabled={!simulado && cam.status !== "ok"}
              onClick={tirarFoto}
            >
              {lado === "frente" ? "Tirar foto da frente" : "Tirar foto do verso"}
            </Button>
            <div className="flex flex-wrap justify-center gap-x-6">
              <TextButton onClick={() => galeriaRef.current?.click()}>Escolher da galeria</TextButton>
              <TextButton onClick={onCancelar}>Cancelar</TextButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Moldura do cartão: escurece fora e marca os cantos em ouro. */
function Moldura() {
  // Cartão ID-1 (1,586:1) ocupando 84% da largura de um quadro 4:3.
  const W = 400;
  const H = 300;
  const w = W * 0.84;
  const h = w / 1.586;
  const x = (W - w) / 2;
  const y = (H - h) / 2;
  const c = 22; // tamanho do canto
  const cantos = [
    `M${x} ${y + c} V${y + 8} Q${x} ${y} ${x + 8} ${y} H${x + c}`,
    `M${x + w - c} ${y} H${x + w - 8} Q${x + w} ${y} ${x + w} ${y + 8} V${y + c}`,
    `M${x + w} ${y + h - c} V${y + h - 8} Q${x + w} ${y + h} ${x + w - 8} ${y + h} H${x + w - c}`,
    `M${x + c} ${y + h} H${x + 8} Q${x} ${y + h} ${x} ${y + h - 8} V${y + h - c}`,
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <mask id="cp-doc-mask">
          <rect width={W} height={H} fill="white" />
          <rect x={x} y={y} width={w} height={h} rx="10" fill="black" />
        </mask>
      </defs>
      <rect width={W} height={H} fill="rgba(0,0,0,.55)" mask="url(#cp-doc-mask)" />
      <rect x={x} y={y} width={w} height={h} rx="10" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" />
      {cantos.map((d) => (
        <path key={d} d={d} fill="none" stroke="var(--color-primary)" strokeWidth="5" strokeLinecap="round" />
      ))}
    </svg>
  );
}
