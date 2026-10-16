import type { InputHTMLAttributes } from "react";

type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> & {
  checked: boolean;
  onChange: () => void;
};

/** Radio ATF: anel preenchido em ouro com ponto escuro. Raiz <span> (vai dentro de um <label>), como o Checkbox. */
export function Radio({ checked, onChange, disabled, className = "", ...rest }: RadioProps) {
  const cls = ["atf-radio", checked && "atf-radio--on", disabled && "atf-radio--disabled", className].filter(Boolean).join(" ");
  return (
    <span className={cls}>
      <input
        type="radio"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
        {...rest}
      />
      <span className="atf-radio__hit" />
      <span className="atf-radio__ring">
        <span className="atf-radio__dot" />
      </span>
    </span>
  );
}
