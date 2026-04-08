// components/ui/LoadingSpinner.tsx  — added missing React import
import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md", text }) => {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} rounded-full border-2 border-[#2e3250] border-t-[#6c63ff] animate-spin`}
      />
      {text && (
        <p className="text-[#8b92b3] text-sm animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;