"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NVIDIA_MODELS, NVIDIA_IMAGE_MODELS } from "@/lib/constants";
import { Sparkles, ImageIcon, CheckCircle2, XCircle } from "lucide-react";

export function AILibraryView() {
  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-5xl mx-auto p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Available AI models across chat and image surfaces.
          </p>
        </div>

        {/* Chat models */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Chat models · NVIDIA NIM
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {NVIDIA_MODELS.map((m) => (
            <Card key={m.id} className="glass border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-semibold text-base">{m.displayName}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {m.id}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {m.badge && (
                      <Badge
                        variant="secondary"
                        className={
                          m.badge === "Recommended"
                            ? "bg-primary/20 text-primary"
                            : ""
                        }
                      >
                        {m.badge}
                      </Badge>
                    )}
                    {m.enabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500">
                        <CheckCircle2 className="w-3 h-3" /> Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <XCircle className="w-3 h-3" /> Disabled
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {m.description}
                </p>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Provider: <span className="text-foreground">{m.provider}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Image models */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Image models · NVIDIA NIM + Pollinations fallback
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NVIDIA_IMAGE_MODELS.map((m) => (
            <Card key={m.id} className="glass border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">
                        {m.displayName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {m.id}
                      </p>
                    </div>
                  </div>
                  {m.badge && (
                    <Badge
                      variant="secondary"
                      className={
                        m.badge === "Recommended"
                          ? "bg-primary/20 text-primary"
                          : ""
                      }
                    >
                      {m.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {m.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-muted">
                    Up to {m.maxN} images
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-muted">
                    {m.supportsNeg ? "Negative prompts" : "No neg prompts"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-muted">
                    {m.provider}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
