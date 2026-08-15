"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Trash2,
  ImageIcon,
  Loader2,
  Sparkles,
  Settings2,
  ChevronDown,
} from "lucide-react";
import { ASPECT_RATIOS, NVIDIA_IMAGE_MODELS } from "@/lib/constants";
import type { GeneratedImage } from "@/lib/ai/image/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AR_PREVIEW: Record<string, string> = {
  "1:1": "aspect-square",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "4:3": "aspect-[4/3]",
  "3:4": "aspect-[3/4]",
  "3:2": "aspect-[3/2]",
  "2:3": "aspect-[2/3]",
};

export function ImagesView() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(
    NVIDIA_IMAGE_MODELS[0].id
  );
  const [aspect, setAspect] = useState("1:1");
  const [n, setN] = useState(1);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState<string>("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const generatedImages = useAppStore((s) => s.generatedImages);
  const addGeneratedImages = useAppStore((s) => s.addGeneratedImages);
  const deleteGeneratedImage = useAppStore((s) => s.deleteGeneratedImage);
  const addNotification = useAppStore((s) => s.addNotification);

  const selectedModel = NVIDIA_IMAGE_MODELS.find((m) => m.id === model);
  const maxN = selectedModel?.maxN || 4;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          aspectRatio: aspect,
          n,
          negativePrompt: negativePrompt.trim() || undefined,
          seed: seed ? parseInt(seed, 10) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Image generation failed");
      }
      const imgs: GeneratedImage[] = data.images || [];
      if (imgs.length === 0) {
        throw new Error("No images returned");
      }
      addGeneratedImages(imgs);
      addNotification({
        title: "Image generated",
        message: `"${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}" — ${imgs.length} image${imgs.length === 1 ? "" : "s"}`,
        type: "success",
        link: { view: "images" },
      });
      toast.success(`Generated ${imgs.length} image${imgs.length === 1 ? "" : "s"}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Generation failed";
      toast.error(message);
      addNotification({
        title: "Image generation failed",
        message,
        type: "error",
        link: { view: "images" },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const a = document.createElement("a");
    a.href = img.dataUrl;
    a.download = `nightmare-${img.id}.${img.mimeType.split("/")[1] || "png"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Form panel */}
      <div className="w-full lg:w-96 lg:h-full lg:border-r border-border bg-card/30 flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Generate Image
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            FLUX.1 via NVIDIA NIM with Pollinations fallback
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A crimson moon over a shattered city skyline, cinematic, ultra-detailed…"
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NVIDIA_IMAGE_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <span>{m.displayName}</span>
                      {m.badge && (
                        <Badge variant="secondary" className="text-[10px]">
                          {m.badge}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModel?.description && (
              <p className="text-[11px] text-muted-foreground">
                {selectedModel.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <div className="grid grid-cols-4 gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspect(ar)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-md border text-xs transition-colors",
                    aspect === ar
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 border border-current rounded-sm",
                      AR_PREVIEW[ar]
                    )}
                  />
                  <span>{ar}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Number of images</Label>
              <span className="text-xs text-muted-foreground font-mono">{n}</span>
            </div>
            <Slider
              value={[n]}
              onValueChange={(v) => setN(Math.min(v[0], maxN))}
              min={1}
              max={maxN}
              step={1}
            />
            <p className="text-[11px] text-muted-foreground">
              Max {maxN} for {selectedModel?.displayName}
            </p>
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full h-9">
                <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                Advanced
                <ChevronDown
                  className={cn(
                    "ml-auto w-3.5 h-3.5 transition-transform",
                    advancedOpen && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label htmlFor="neg">Negative prompt</Label>
                <Input
                  id="neg"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="blurry, low quality, distorted"
                  disabled={!selectedModel?.supportsNeg}
                />
                {!selectedModel?.supportsNeg && (
                  <p className="text-[11px] text-muted-foreground">
                    Not supported by this model
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="seed">Seed (optional)</Label>
                <Input
                  id="seed"
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="p-4 border-t border-border">
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Gallery panel (always visible — responsive grid) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Gallery · {generatedImages.length} image
            {generatedImages.length === 1 ? "" : "s"}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scroll p-5">
          {loading && (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
              {Array.from({ length: n }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={cn(
                    "w-full rounded-lg",
                    AR_PREVIEW[aspect]
                  )}
                />
              ))}
            </div>
          )}
          {generatedImages.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No images yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Your generated images will appear here. Start by writing a
                prompt on the left.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {generatedImages.map((img) => (
                <Card
                  key={img.id}
                  className="glass border-border/60 overflow-hidden group"
                >
                  <div className="relative">
                    <img
                      src={img.dataUrl}
                      alt={img.prompt}
                      className="w-full h-auto block"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end justify-end gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleDownload(img)}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteGeneratedImage(img.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-2.5">
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {img.prompt}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {img.backend}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {img.width}×{img.height}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
