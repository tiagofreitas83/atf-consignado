import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  size?: "sm" | "md" | "lg";
  "aria-label": string;
};

/** Botão circular só com ícone (variante standard). */
export function IconButton({ icon, size = "md", className = "", type = "button", ...rest }: IconButtonProps) {
  return (
    <button type={type} className={`atf-iconbtn atf-iconbtn--standard atf-iconbtn--${size} ${className}`} {...rest}>
      <Icon name={icon} size={size === "sm" ? 18 : 24} />
    </button>
  );
}
