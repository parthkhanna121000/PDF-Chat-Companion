// components/ui/Badge.tsx
import React from "react";

type BadgeVariant = "blue" | "green" | "amber" | "red" | "neutral" | "purple";
type BadgeSize    = "sm" | "md";

export interface BadgeProps {
  variant?:   BadgeVariant;
  size?:      BadgeSize;
  icon?:      React.ReactNode;
  dot?:       boolean;
  pulse?:     boolean;
  className?: string;
  children:   React.ReactNode;
}

const variants: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  blue:    { bg: "rgba(91,94,244,.1)",    text: "#9090e0", border: "rgba(91,94,244,.25)",    dot: "#5b5ef4"  },
  green:   { bg: "rgba(34,197,94,.1)",    text: "#22c55e", border: "rgba(34,197,94,.25)",    dot: "#22c55e"  },
  amber:   { bg: "rgba(245,158,11,.1)",   text: "#f59e0b", border: "rgba(245,158,11,.25)",   dot: "#f59e0b"  },
  red:     { bg: "rgba(248,113,113,.09)", text: "#f87171", border: "rgba(248,113,113,.25)",  dot: "#f87171"  },
  neutral: { bg: "rgba(255,255,255,.04)", text: "#6868a0", border: "rgba(255,255,255,.08)",  dot: "#42425a"  },
  purple:  { bg: "rgba(168,85,247,.1)",   text: "#c084fc", border: "rgba(168,85,247,.25)",   dot: "#a855f7"  },
};

const sizes: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px] gap-1   rounded-md",
  md: "px-2.5 py-1   text-[11px] gap-1.5 rounded-lg",
};

export function Badge({ variant = "neutral", size = "md", icon, dot = false, pulse = false, className = "", children }: BadgeProps) {
  const v = variants[variant];
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wide whitespace-nowrap select-none ${sizes[size]} ${className}`}
      style={{ background: v.bg, color: v.text, border: `1px solid ${v.border}`, fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {dot && (
        <>
          <span className={`inline-block rounded-full flex-shrink-0 ${size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5"}`}
            style={{
              background: v.dot,
              boxShadow: pulse ? `0 0 5px ${v.dot}` : undefined,
              animation: pulse ? "badge-pulse 1.4s ease-in-out infinite" : undefined,
            }}
          />
          <style>{`@keyframes badge-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}`}</style>
        </>
      )}
      {!dot && icon && <span className="flex-shrink-0 flex items-center">{icon}</span>}
      <span className="leading-none">{children}</span>
    </span>
  );
}

export default Badge;