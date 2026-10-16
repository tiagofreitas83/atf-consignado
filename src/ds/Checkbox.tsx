import type { InputHTMLAttributes } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
};

/**
 * Checkbox ATF: quadrado com cantos de 2px, preenchido em ouro quando marcado.
 * Diferente do DS, a raiz é um <span> para poder ficar dentro do <label> que
 * envolve o texto do aceite (label dentro de label é HTML inválido).
 */
export function Checkbox({ checked, onChange, error, disabled, className = "", ...rest }: CheckboxProps) {
  const cls = ["atf-check", checked && "atf-check--on", error && "atf-check--error", disabled && "atf-check--disabled", className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
        {...rest}
      />
      <span className="atf-check__hit" />
      <span className="atf-check__box">
        {checked && (
          <svg width="12" height="10" viewBox="0 -0.7 12 10" fill="none" aria-hidden="true">
            <path d="M4 9.4L0 5.4L1.4 4L4 6.6L10.6 0L12 1.4L4 9.4Z" fill="currentColor" />
          </svg>
        )}
      </span>
    </span>
  );
}
