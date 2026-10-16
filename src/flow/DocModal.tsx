import { useEffect, useId, useRef } from "react";
import { Button, IconButton } from "../ds";
import { DOCS } from "./content";
import type { Doc } from "./useConsignado";

/** Modal de Termos/Privacidade/LGPD. Fecha no scrim, no X, em "Entendi" e com Esc. */
export function DocModal({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  const titleId = useId();
  const okRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const { title, paras } = DOCS[doc];

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

  return (
    <div onClick={onClose} className="fixed inset-0 z-20 flex items-center justify-center bg-[rgba(0,0,0,.4)] p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[560px] flex-col overflow-hidden rounded-card bg-neutral-100 shadow-3"
      >
        <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
          <h2 id={titleId} className="m-0 text-xl font-semibold">
            {title}
          </h2>
          <IconButton icon="close" onClick={onClose} aria-label="Fechar" />
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto px-6 pb-6">
          {paras.map((p) => (
            <p key={p} className="m-0 text-sm leading-[1.6] text-neutral-20 text-pretty">
              {p}
            </p>
          ))}
        </div>
        <div className="flex justify-end border-t border-neutral-90 px-6 py-4">
          <Button ref={okRef} variant="brand" size="md" onClick={onClose}>
            Entendi
          </Button>
        </div>
      </div>
    </div>
  );
}
