import { useId, type InputHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";
import { MASKS, type MaskType } from "./masks";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  errors?: string;
  mask?: MaskType;
  leftIcon?: IconName;
};

/**
 * Input ATF: fieldset com label flutuante recortada, ícone à esquerda, ícone de
 * erro à direita e helper/erro absolutos abaixo (não reservam espaço — quem usa
 * envolve num wrapper com padding-bottom de 22px).
 */
export function Input({
  id,
  label,
  value,
  onChange,
  description,
  errors,
  mask,
  leftIcon,
  disabled,
  type = "text",
  inputMode,
  className = "",
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? `input-${autoId}`;
  const hintId = `${inputId}-hint`;
  const hasError = Boolean(errors);
  const hint = errors ?? description;
  const cls = [
    "atf-field",
    hint && "atf-field--tall",
    hasError && "atf-field--error",
    disabled && "atf-field--disabled",
    leftIcon && "atf-field--hasleft",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls}>
      <fieldset className="atf-field__box" disabled={disabled}>
        <label className="atf-field__label caption1-medium" htmlFor={inputId}>
          {label}
        </label>
        {leftIcon && (
          <div className="atf-field__lefticon" aria-hidden="true">
            <Icon name={leftIcon} size={24} />
          </div>
        )}
        <input
          {...rest}
          id={inputId}
          type={type}
          value={value}
          inputMode={inputMode ?? (mask ? "numeric" : undefined)}
          onChange={(e) => onChange(mask ? MASKS[mask](e.target.value) : e.target.value)}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hint ? hintId : undefined}
          className="atf-field__input body3-medium"
        />
        <div className={`atf-field__right${hasError ? " atf-field__right--min" : ""}`}>
          {hasError && (
            <div className="atf-field__erroricon">
              <div className="atf-field__erroricon-inner" aria-hidden="true">
                <Icon name="errorBold" size={24} />
              </div>
            </div>
          )}
        </div>
      </fieldset>
      {hint && (
        <span id={hintId} className="atf-field__hint caption1-medium" role={hasError ? "alert" : undefined}>
          {hint}
        </span>
      )}
    </div>
  );
}
