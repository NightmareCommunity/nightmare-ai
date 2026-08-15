"use client";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
}

export function LogoMark({
  size = 36,
  className,
  withWordmark = false,
}: LogoMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src="/logo.svg"
        alt="NIGHTMARE AI"
        width={size}
        height={size}
        className="shrink-0 rounded-xl crimson-glow-sm"
        style={{ width: size, height: size }}
      />
      {withWordmark && (
        <div className="flex flex-col leading-none">
          <span className="font-bold tracking-tight text-base">
            <span className="bg-gradient-to-r from-[#ff3b5c] to-[#dc2640] bg-clip-text text-transparent">
              NIGHTMARE
            </span>
            <span className="text-foreground ml-1.5">AI</span>
          </span>
          <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
            Workspace
          </span>
        </div>
      )}
    </div>
  );
}
