"use client";

import { ReactNode } from "react";

interface GlowCardProps {
  variant: "blue" | "green" | "purple";
  children: ReactNode;
  className?: string;
}

const variantClasses = {
  blue: { outer: "glow-blue", inner: "glow-card-inner-blue" },
  green: { outer: "glow-green", inner: "glow-card-inner-green" },
  purple: { outer: "glow-purple", inner: "glow-card-inner-purple" },
};

export function GlowCard({
  variant,
  children,
  className = "",
}: GlowCardProps) {
  const cls = variantClasses[variant];
  return (
    <div className={`glow-card ${cls.outer} ${className}`}>
      <div className={`glow-card-inner ${cls.inner}`}>{children}</div>
    </div>
  );
}
