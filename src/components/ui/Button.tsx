import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "border border-white/20 bg-white text-black hover:bg-zinc-100 shadow-[0_0_24px_rgba(255,255,255,0.18)]",
  ghost: "border border-transparent bg-transparent text-zinc-200 hover:bg-white/5",
  outline:
    "border border-white/25 bg-white/[0.03] text-white hover:border-white/50 hover:bg-white/[0.06]",
  danger:
    "border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium tracking-wide transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
