"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, ArrowRight } from "lucide-react";
import { TEMPLATES } from "@/lib/constants";
import { toast } from "sonner";

export function TemplatesView() {
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const [selected, setSelected] = useState<string | null>(null);

  const handleUse = (id: string) => {
    setSelected(id);
    const t = TEMPLATES.find((x) => x.id === id);
    if (t) {
      toast.success(`Selected template: ${t.name}`);
    }
    // We don't have a global "selected template" store slot; just navigate.
    setTimeout(() => setDashboardView("presentations"), 300);
  };

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-6xl mx-auto p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-primary" />
            Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a starting layout for your next presentation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => (
            <Card
              key={t.id}
              className={`glass border-border/60 hover:border-primary/40 transition-all overflow-hidden group ${
                selected === t.id ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="relative aspect-video bg-muted overflow-hidden">
                <img
                  src={t.thumbnail}
                  alt={t.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.layouts} layouts
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => handleUse(t.id)}
                  >
                    Use
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
