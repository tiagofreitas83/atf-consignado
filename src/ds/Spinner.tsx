import { useId } from "react";

const SIZES = { xs: 24, sm: 32, default: 36, md: 48, lg: 64, xl: 88 } as const;
const STROKE = { xs: 4, sm: 4, default: 4, md: 5, lg: 7, xl: 9 } as const;

/** Spinner ATF: trilho neutro com arco em gradiente ouro (285°), girando. */
export function Spinner({ size = "default", label = "Carregando" }: { size?: keyof typeof SIZES; label?: string }) {
  const gid = useId();
  const box = SIZES[size];
  const stroke = STROKE[size];
  const r = (box - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * (285 / 360);
  return (
    <span className="atf-spinner" role="status" aria-label={label} style={{ width: box, height: box }}>
      <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="1" y1="0" x2="0" y2="1">
            <stop offset="42.19%" stopColor="var(--color-secondary-70)" />
            <stop offset="100%" stopColor="var(--color-primary)" />
          </linearGradient>
        </defs>
        <circle cx={c} cy={c} r={r} stroke="var(--color-neutral-90)" strokeWidth={stroke} fill="none" />
        <circle
          cx={c}
          cy={c}
          r={r}
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circ - arc}`}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </svg>
    </span>
  );
}
