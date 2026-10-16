import type { CSSProperties, SVGProps } from "react";
import { ICONS, ICON_ALIASES } from "./icons";

export type IconName = keyof typeof ICONS | keyof typeof ICON_ALIASES;

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
  size?: number;
  color?: string;
};

/** Ícone ATF por nome; herda `currentColor`. */
export function Icon({ name, size = 24, color = "currentColor", style, ...rest }: IconProps) {
  const key = (ICON_ALIASES as Record<string, keyof typeof ICONS>)[name] ?? (name as keyof typeof ICONS);
  const entry = ICONS[key];
  const svgStyle: CSSProperties = { color, display: "inline-block", flexShrink: 0, ...style };
  return (
    <svg
      width={size}
      height={size}
      viewBox={entry.v}
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={svgStyle}
      dangerouslySetInnerHTML={{ __html: entry.p }}
      {...rest}
    />
  );
}
