import type { CSSProperties } from "react";

type IconProps = { size?: number; className?: string; style?: CSSProperties; strokeWidth?: number };

function base(size: number, strokeWidth: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor" as const,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function WrenchIcon({ size = 16, className, style, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style} aria-hidden>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

export function RocketIcon({ size = 16, className, style, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style} aria-hidden>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export function FlameIcon({ size = 14, className, style, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style} aria-hidden>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export function NetworkIcon({ size = 16, className, style, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style} aria-hidden>
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="8" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M6.8 6.8 10.6 16 M13.4 16.8 17.4 9.4 M7 6.5 17 7.6" />
    </svg>
  );
}

export function SendIcon({ size = 16, className, style, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style} aria-hidden>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22 11 13 2 9 22 2z" />
    </svg>
  );
}

export function PlayIcon({ size = 14, className, style, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style} aria-hidden>
      <path d="M7 4.5 19 12 7 19.5z" />
    </svg>
  );
}

export function CheckIcon({ size = 13, className, style, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style} aria-hidden>
      <path d="M20 6 9 17 4 12" />
    </svg>
  );
}

export function AlertIcon({ size = 13, className, style, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style} aria-hidden>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function CrossIcon({ size = 13, className, style, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style} aria-hidden>
      <path d="M18 6 6 18 M6 6l12 12" />
    </svg>
  );
}

export function CircleIcon({ size = 13, className, style, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style} aria-hidden>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
