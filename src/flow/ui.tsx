import type { ReactNode } from "react";

/** Coluna de 640px dos passos 2–5, com a entrada cpFade. */
export function StepColumn({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <section aria-label={label} className={`mx-auto flex max-w-[640px] flex-col gap-8 animate-cp-fade ${className}`}>
      {children}
    </section>
  );
}

export function StepHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="m-0 text-[clamp(28px,7vw,48px)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">{title}</h1>
      <p className="m-0 text-base leading-normal text-neutral-40 text-pretty">{lead}</p>
    </div>
  );
}

/** Voltar à esquerda; primário à direita (no celular, primário em cima e em largura total). */
export function ActionBar({ back, children }: { back: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap-reverse items-center justify-between gap-3">
      {back}
      <div className="ml-auto flex max-w-[360px] flex-[1_1_240px] flex-col">{children}</div>
    </div>
  );
}

/** Reserva o espaço do helper/erro do Input (que é position:absolute no DS). */
export const FieldSlot = ({ children }: { children: ReactNode }) => <div className="pb-[22px]">{children}</div>;

export const Tile = ({ tone, className = "", children }: { tone: "subtle" | "success" | "error" | "amber"; className?: string; children: ReactNode }) => {
  const bg = { subtle: "bg-neutral-95", success: "bg-success-90", error: "bg-error-90", amber: "bg-secondary-90" }[tone];
  return <div className={`rounded-xl p-4 ${bg} ${className}`}>{children}</div>;
};

export const TextButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button type="button" onClick={onClick} className="atf-link self-start py-1 text-sm font-semibold">
    {children}
  </button>
);
