"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import type { ModelDescriptor } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

interface ModelPickerProps {
  value: string;
  onChange: (modelId: string) => void;
}

export function ModelPicker({ value, onChange }: ModelPickerProps) {
  const [models, setModels] = useState<ModelDescriptor[]>([]);
  const [defaultModel, setDefaultModel] = useState("auto");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setModels(data.models || []);
        setDefaultModel(data.defaultModel || "auto");
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected =
    models.find((m) => m.id === value) ||
    models.find((m) => m.id === defaultModel);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 max-w-[180px]">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="truncate text-xs">{selected?.displayName || "Model"}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Choose a model
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {models.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onChange(m.id)}
            className="flex items-start gap-2 py-2 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{m.displayName}</span>
                {m.badge && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      m.badge === "Recommended" &&
                        "bg-primary/20 text-primary"
                    )}
                  >
                    {m.badge}
                  </Badge>
                )}
              </div>
              {m.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {m.description}
                </p>
              )}
            </div>
            {value === m.id && <Check className="w-4 h-4 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
