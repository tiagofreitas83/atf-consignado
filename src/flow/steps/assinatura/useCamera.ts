import { useCallback, useEffect, useRef, useState } from "react";

export type StatusCamera = "abrindo" | "ok" | "erro" | "desligada";

/**
 * Abre a câmera (`user` = frontal, `environment` = traseira) enquanto `ativa`.
 * `capturar()` devolve o quadro atual em JPEG. Desliga ao desmontar.
 */
export function useCamera(facingMode: "user" | "environment", ativa: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<StatusCamera>(ativa ? "abrindo" : "desligada");
  const [tentativa, setTentativa] = useState(0);

  const parar = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!ativa) {
      setStatus("desligada");
      return;
    }
    let cancelado = false;
    setStatus("abrindo");
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("erro");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 } }, audio: false })
      .then((stream) => {
        if (cancelado) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("ok");
      })
      .catch(() => !cancelado && setStatus("erro"));
    return () => {
      cancelado = true;
      parar();
    };
  }, [ativa, facingMode, tentativa, parar]);

  const capturar = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) return resolve(null);
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        canvas.toBlob(resolve, "image/jpeg", 0.9);
      }),
    [],
  );

  return { videoRef, status, capturar, parar, tentarDeNovo: () => setTentativa((n) => n + 1) };
}
