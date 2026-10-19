import type { ReactNode } from "react";
import { Icon, Radio, type IconName } from "../ds";

/** Coluna de 640px dos passos 2–5, com a entrada cpFade. */
export function StepColumn({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <section aria-label={label} className={`mx-auto flex w-full max-w-[640px] min-w-0 flex-col gap-8 animate-cp-fade ${className}`}>
      {children}
    </section>
  );
}

export function StepHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="m-0 text-[clamp(28px,7vw,48px)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance [overflow-wrap:anywhere]">{title}</h1>
      <p className="m-0 text-base leading-normal text-neutral-40 text-pretty">{lead}</p>
    </div>
  );
}

/**
 * Ações do passo. No celular: primário em cima, largura total, e "Voltar"
 * centralizado abaixo. A partir de 640px: "Voltar" à esquerda (texto alinhado
 * à coluna) e primário à direita, até 360px.
 */
export function ActionBar({ back, children }: { back: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex justify-center sm:-ml-2 sm:justify-start">{back}</div>
      <div className="flex w-full flex-col sm:ml-auto sm:max-w-[360px] sm:flex-[1_1_240px]">{children}</div>
    </div>
  );
}

/** Envolve um Input. O helper/erro do Input fica no fluxo do layout, então não há espaço a reservar. */
export const FieldSlot = ({ children }: { children: ReactNode }) => <div>{children}</div>;

export const Tile = ({ tone, className = "", children }: { tone: "subtle" | "success" | "error" | "amber"; className?: string; children: ReactNode }) => {
  const bg = { subtle: "bg-neutral-95", success: "bg-success-90", error: "bg-error-90", amber: "bg-secondary-90" }[tone];
  return <div className={`rounded-xl p-4 ${bg} ${className}`}>{children}</div>;
};

/** Link de ação solto (fora de frase), com área de toque de 44px. */
export const TextButton = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="atf-link inline-flex min-h-11 items-center self-start text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
  >
    {children}
  </button>
);

/** Linha de links de ação; quebra limpa no celular. */
export const LinkRow = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap items-center gap-x-6 -my-2">{children}</div>;

/** Opção selecionável (card com radio). */
export function Opcao({ name, checked, onChange, titulo, detalhe, icon }: { name: string; checked: boolean; onChange: () => void; titulo: string; detalhe: ReactNode; icon?: IconName }) {
  return (
    <label
      className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
        checked ? "border-neutral-20 bg-neutral-100" : "border-neutral-90 [@media(hover:hover)]:hover:border-neutral-80"
      }`}
    >
      <Radio name={name} checked={checked} onChange={onChange} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[15px] font-semibold">{titulo}</span>
        <span className="text-sm leading-normal text-neutral-40 text-pretty">{detalhe}</span>
      </span>
      {icon && (
        <span className="hidden shrink-0 text-neutral-40 min-[360px]:flex" aria-hidden="true">
          <Icon name={icon} size={24} />
        </span>
      )}
    </label>
  );
}
