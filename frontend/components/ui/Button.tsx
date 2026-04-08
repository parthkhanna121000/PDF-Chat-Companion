// components/ui/Button.tsx
import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit";
  fullWidth?: boolean;
}

const variantClass: Record<string, string> = {
  primary:   "bg-[#5b5ef4] hover:bg-[#6c6ff5] text-white border border-transparent shadow-[0_2px_10px_rgba(91,94,244,.3)] active:scale-[.98]",
  secondary: "bg-[#111122] hover:bg-[#181830] text-[#a0a0d0] border border-[#1e1e38] hover:border-[#5b5ef4]/40",
  danger:    "bg-transparent hover:bg-[#f87171]/[.07] text-[#f87171] border border-[#f87171]/25 hover:border-[#f87171]/45",
  ghost:     "bg-transparent hover:bg-[#111122] text-[#6868a0] border border-transparent hover:text-[#c0c0e8]",
};

const sizeClass: Record<string, string> = {
  sm: "px-3 py-1.5 text-[11.5px] gap-1.5 rounded-lg",
  md: "px-4 py-2 text-[12.5px] gap-2 rounded-xl",
  lg: "px-5 py-2.5 text-[13.5px] gap-2 rounded-xl",
};

const Button: React.FC<ButtonProps> = ({
  children, onClick, variant = "primary", size = "md",
  disabled = false, loading = false, className = "",
  type = "button", fullWidth = false,
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-medium tracking-tight transition-all duration-150 outline-none whitespace-nowrap select-none",
        variantClass[variant],
        sizeClass[size],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer",
        className,
      ].join(" ")}
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {loading && (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin flex-shrink-0" />
      )}
      {children}
    </button>
  );
};

export default Button;
export type { ButtonProps };