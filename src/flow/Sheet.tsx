import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, IconButton } from "../ds";

/**
 * Bottom sheet no celular, modal centralizado no desktop. Fecha no scrim, no X, em "Entendi" e com Esc.
 * Vai num portal no <body>: dentro de um passo, o transform da animação de entrada prenderia o `fixed`.
 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  const okRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      anterior?.focus();
    };
  }, []);

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-20 flex items-end justify-center bg-[rgba(0,0,0,.4)] sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="cp-sheet flex max-h-[88dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-card bg-neutral-100 shadow-3 sm:max-h-[80vh] sm:rounded-card"
      >
        <div className="flex items-start justify-between gap-3 pt-6 pr-3 pb-4 pl-[clamp(20px,5vw,24px)] sm:items-center">
          <h2 id={titleId} className="m-0 pt-2 text-xl leading-tight font-semibold text-balance sm:pt-0">
            {title}
          </h2>
          <IconButton icon="close" onClick={onClose} aria-label="Fechar" />
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto overscroll-contain px-[clamp(20px,5vw,24px)] pb-6">{children}</div>
        <div className="cp-sheet-footer flex justify-end border-t border-neutral-90 px-[clamp(20px,5vw,24px)] pt-4">
          <Button ref={okRef} variant="brand" size="md" className="w-full sm:w-auto" onClick={onClose}>
            Entendi
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
