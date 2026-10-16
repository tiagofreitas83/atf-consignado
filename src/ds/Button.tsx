import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type ButtonProps = Omit<ComponentProps<"button">, "children"> & {
  variant?: "brand" | "neutral" | "outline" | "text";
  size?: "xs" | "sm" | "md" | "lg";
  rightIcon?: IconName;
  /** Largura 100% com quebra de linha (CTAs da jornada). */
  fullWidth?: boolean;
  children: ReactNode;
};

/** Botão ATF: quatro variantes × quatro alturas, ícone opcional à direita. */
export function Button({
  variant = "brand",
  size = "md",
  rightIcon,
  fullWidth,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const cls = ["atf-btn", `atf-btn--${variant}`, `atf-btn--${size}`, fullWidth && "atf-btn--full", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button type={type} className={cls} {...rest}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: size === "xs" ? 4 : 8 }}>
        {children}
        {rightIcon && <Icon name={rightIcon} size={size === "xs" ? 16 : 18} />}
      </span>
    </button>
  );
}
