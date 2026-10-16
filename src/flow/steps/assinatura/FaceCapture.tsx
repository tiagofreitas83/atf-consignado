import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Button, Icon } from "../../../ds";
import { DemoSpeed } from "../../timing";
import { TextButton } from "../../ui";

type Fase = "camera" | "enquadre" | "aproxime" | "analisando" | "erro";

const INSTRUCAO: Record<Exclude<Fase, "erro">, string> = {
  camera: "Abrindo a câmera…",
  enquadre: "Centralize o rosto no oval",
  aproxime: "Agora aproxime o rosto da câmera",
  analisando: "Analisando…",
};

// Prova de vida no estilo FaceTec ZoOm: o oval começa pequeno (rosto longe) e
// cresce (rosto perto); a variação de perspectiva entre os dois quadros é o que
// o motor de liveness analisa. Aqui a captura é simulada por tempo — em
// produção, o SDK do fornecedor de biometria conduz as fases e devolve o pacote.
const PROGRESSO: Record<Fase, number> = { camera: 0, enquadre: 45, aproxime: 90, analisando: 100, erro: 0 };
const ESCALA: Record<Fase, number> = { camera: 1, enquadre: 1, aproxime: 1.22, analisando: 1.22, erro: 1 };
const CX = 150;
const CY = 190;
const RX = 92;
const RY = 124;

/** Oval como path começando no topo (sentido horário), para o progresso partir de cima. */
const ovalPath = (k: number) => {
  const rx = RX * k;
  const ry = RY * k;
  return `M${CX} ${CY - ry} A${rx} ${ry} 0 1 1 ${CX} ${CY + ry} A${rx} ${ry} 0 1 1 ${CX} ${CY - ry}`;
};

/** Interpola até `alvo` em `ms` (SVG dentro de <mask> não anima por CSS transform). */
function useTween(alvo: number, ms: number) {
  const [valor, setValor] = useState(alvo);
  const atual = useRef(alvo);
  useEffect(() => {
    const de = atual.current;
    if (de === alvo) return;
    if (ms <= 0) {
      atual.current = alvo;
      setValor(alvo);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const passo = (t: number) => {
      const f = Math.min((t - t0) / ms, 1);
      const e = 1 - Math.pow(1 - f, 3);
      atual.current = de + (alvo - de) * e;
      setValor(atual.current);
      if (f < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, ms]);
  return valor;
}

export function FaceCapture({ onCaptura, onCancelar }: { onCaptura: (frame: Blob | null) => void; onCancelar: () => void }) {
  const speed = useContext(DemoSpeed);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [fase, setFase] = useState<Fase>("camera");
  const [simulado, setSimulado] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const reduzido = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const escala = useTween(ESCALA[fase], reduzido ? 0 : 900 * speed);

  const pararCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Abre a câmera frontal (ou cai para o modo simulado, se pedido).
  useEffect(() => {
    let cancelado = false;
    setFase("camera");
    if (simulado) {
      setFase("enquadre");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setFase("erro");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 720 } }, audio: false })
      .then((stream) => {
        if (cancelado) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setFase("enquadre");
      })
      .catch(() => !cancelado && setFase("erro"));
    return () => {
      cancelado = true;
      pararCamera();
    };
  }, [simulado, tentativa, pararCamera]);

  // Avança enquadre → aproxime → analisando.
  useEffect(() => {
    if (fase !== "enquadre" && fase !== "aproxime") return;
    const t = window.setTimeout(() => setFase(fase === "enquadre" ? "aproxime" : "analisando"), 2200 * speed);
    return () => window.clearTimeout(t);
  }, [fase, speed]);

  // Captura um quadro e entrega para o back-end.
  useEffect(() => {
    if (fase !== "analisando") return;
    const video = videoRef.current;
    const fim = (frame: Blob | null) => {
      pararCamera();
      onCaptura(frame);
    };
    if (simulado || !video || !video.videoWidth) return fim(null);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(fim, "image/jpeg", 0.85);
    // onCaptura muda a cada render do pai; só a fase importa aqui.
  }, [fase]);

  if (fase === "erro") {
    return (
      <div className="flex flex-col gap-4 rounded-xl bg-error-90 p-4 text-error-10">
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Não conseguimos acessar a câmera</span>
          <span className="leading-normal text-pretty">
            Permita o acesso à câmera nas configurações do navegador e tente novamente. O reconhecimento usa a câmera frontal e não grava vídeo.
          </span>
        </div>
        <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
          <Button variant="neutral" size="sm" onClick={() => setTentativa((n) => n + 1)}>
            Tentar novamente
          </Button>
          {/* TEMPORÁRIO (demonstração): remover antes de produção. */}
          <TextButton onClick={() => setSimulado(true)}>Simular sem câmera</TextButton>
          <TextButton onClick={onCancelar}>Cancelar</TextButton>
        </div>
      </div>
    );
  }

  const d = ovalPath(escala);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative aspect-[3/4] w-[min(100%,320px,42dvh)] overflow-hidden rounded-card bg-neutral-95">
        {simulado ? (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-80" aria-hidden="true">
            <Icon name="faceIdIos" size={96} />
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 size-full -scale-x-100 object-cover" />
        )}
        <svg viewBox="0 0 300 400" className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <mask id="cp-face-mask">
              <rect width="300" height="400" fill="white" />
              <path d={d} fill="black" />
            </mask>
          </defs>
          <rect width="300" height="400" fill="rgba(255,255,255,.88)" mask="url(#cp-face-mask)" />
          <path d={d} fill="none" stroke="var(--color-neutral-90)" strokeWidth="6" />
          <path
            d={d}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="6"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - PROGRESSO[fase]}
            style={{ transition: `stroke-dashoffset ${2.2 * speed}s linear` }}
          />
        </svg>
      </div>
      <p aria-live="polite" className="m-0 text-center text-base font-semibold">
        {INSTRUCAO[fase]}
      </p>
      {fase !== "analisando" && (
        <div className="flex justify-center">
          <TextButton onClick={onCancelar}>Cancelar</TextButton>
        </div>
      )}
    </div>
  );
}
