"use client";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

interface IconProps extends LucideProps {
  name: string;
  fallback?: string;
}

export function Icon({ name, fallback = "Circle", ...props }: IconProps) {
  const icons = LucideIcons as unknown as Record<
    string,
    React.ComponentType<LucideProps>
  >;
  const Component = icons[name] || icons[fallback] || LucideIcons.Circle;
  return <Component {...props} />;
}
