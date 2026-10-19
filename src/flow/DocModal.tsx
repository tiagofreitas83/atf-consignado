import { DOCS } from "./content";
import { Sheet } from "./Sheet";
import type { Doc } from "./useConsignado";

/** Modal de Termos/Privacidade/LGPD. */
export function DocModal({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  const { title, paras } = DOCS[doc];
  return (
    <Sheet title={title} onClose={onClose}>
      {paras.map((p) => (
        <p key={p} className="m-0 text-sm leading-[1.6] text-neutral-20 text-pretty">
          {p}
        </p>
      ))}
    </Sheet>
  );
}
