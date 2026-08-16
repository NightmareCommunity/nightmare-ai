"use client";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  Download,
  Trash2,
  ImageIcon,
  Loader2,
  Sparkles,
  Settings2,
  Send,
  RefreshCw,
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

const AR_DIMENSIONS: Record<string, string> = {
  "1:1": "1024 × 1024",
  "16:9": "1344 × 768",
  "9:16": "768 × 1344",
  "4:3": "1152 × 896",
  "3:4": "896 × 1152",
  "3:2": "1216 × 832",
  "2:3": "832 × 1216",
};

interface ImageTurn {
  id: string;
  prompt: string;
  images: GeneratedImage[];
  createdAt: string;
  error?: string;
}

export function ImagesView() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(NVIDIA_IMAGE_MODELS[0].id);
  const [aspect, setAspect] = useState("1:1");
  const [n, setN] = useState(1);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState<string>("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ImageTurn[]>([]);

  const generatedImages = useAppStore((s) => s.generatedImages);
  const addGeneratedImages = useAppStore((s) => s.addGeneratedImages);
  const deleteGeneratedImage = useAppStore((s) => s.deleteGeneratedImage);
  const addNotification = useAppStore((s) => s.addNotification);

  const selectedModel = NVIDIA_IMAGE_MODELS.find((m) => m.id === model);
  const maxN = selectedModel?.maxN || 4;

  const scrollRef = useRef<HTMLDivElement>(null);

  // Build conversation turns from generatedImages (group by prompt + timestamp proximity)
  useEffect(() => {
    if (generatedImages.length === 0) {
      setTurns([]);
      return;
    }
    // Group images that share the same prompt (within a 5-second window)
    const groups: ImageTurn[] = [];
    for (const img of generatedImages) {
      const lastGroup = groups[groups.length - 1];
      if (
        lastGroup &&
        lastGroup.prompt === img.prompt &&
        Math.abs(new Date(img.createdAt).getTime() - new Date(lastGroup.createdAt).getTime()) < 5000
      ) {
        lastGroup.images.push(img);
      } else {
        groups.push({
          id: img.id + "-turn",
          prompt: img.prompt,
          images: [img],
          createdAt: img.createdAt,
        });
      }
    }
    setTurns(groups);
  }, [generatedImages]);

  // Auto-scroll to bottom when new turns arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, loading]);

  const handleGenerate = async (regenPrompt?: string) => {
    const userPrompt = (regenPrompt || prompt).trim();
    if (!userPrompt) {
      toast.error("Please enter a prompt");
      return;
    }
    if (regenPrompt) {
      setPrompt(regenPrompt);
    }
    setLoading(true);
    const turnId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();

    // Optimistically show the turn with a loading state
    const optimisticTurn: ImageTurn = {
      id: turnId,
      prompt: userPrompt,
      images: [],
      createdAt,
    };
    setTurns((prev) => [...prev, optimisticTurn]);

    // Clear the input (unless regenerating)
    if (!regenPrompt) setPrompt("");

    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
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
        message: `"${userPrompt.slice(0, 50)}${userPrompt.length > 50 ? "..." : ""}"`,
        type: "success",
        link: { view: "images" },
      });
      toast.success(`Generated ${imgs.length} image${imgs.length === 1 ? "" : "s"}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      // Update the optimistic turn with the error
      setTurns((prev) =>
        prev.map((t) =>
          t.id === turnId ? { ...t, error: message } : t
        )
      );
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

  const handleDeleteTurn = (turn: ImageTurn) => {
    for (const img of turn.images) {
      deleteGeneratedImage(img.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ImageIcon className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">Image Studio</h1>
              <p className="text-[11px] text-muted-foreground truncate">
                FLUX.1 via NVIDIA NIM · Pollinations fallback
              </p>
            </div>
          </div>
          {/* Settings popover */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Select value={aspect} onValueChange={setAspect}>
              <SelectTrigger className="h-8 w-[72px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ar) => (
                  <SelectItem key={ar} value={ar} className="text-xs">
                    {ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-8 w-[120px] sm:w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NVIDIA_IMAGE_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                  <Settings2 className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Count</label>
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Negative prompt</label>
                    <input
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="blurry, low quality"
                      disabled={!selectedModel?.supportsNeg}
                    />
                    {!selectedModel?.supportsNeg && (
                      <p className="text-[11px] text-muted-foreground">
                        Not supported by this model
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seed (optional)</label>
                    <input
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="Random"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Conversation area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scroll"
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 space-y-6">
          {turns.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center min-h-[60vh]">
              <div className="w-16 h-16 rounded-2xl nightmare-gradient flex items-center justify-center crimson-glow-sm mb-4">
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Image Studio</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Describe an image and I&apos;ll generate it for you. Try to be
                specific about style, mood, and composition.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {[
                  "A crimson moon over a shattered city skyline, cinematic, ultra-detailed",
                  "Portrait of a cyberpunk samurai, neon lights, rain, 8k",
                  "A serene Japanese garden with cherry blossoms, watercolor style",
                  "Abstract geometric pattern, crimson and black, minimalist",
                ].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleGenerate(ex)}
                    className="text-left p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            turns.map((turn) => (
              <div key={turn.id} className="space-y-3">
                {/* User prompt bubble */}
                <div className="flex gap-3 px-1">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-bold text-foreground">U</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold mb-0.5">You</div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {turn.prompt}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span>{AR_DIMENSIONS[aspect]}</span>
                      <span>·</span>
                      <span>{selectedModel?.displayName}</span>
                    </div>
                  </div>
                </div>

                {/* Assistant response (images or error) */}
                <div className="flex gap-3 px-1">
                  <div className="shrink-0 w-8 h-8 rounded-full nightmare-gradient flex items-center justify-center overflow-hidden">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold mb-1.5">NIGHTMARE AI</div>
                    {turn.error ? (
                      <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                        <p className="text-sm text-destructive mb-2">
                          {turn.error}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerate(turn.prompt)}
                          className="h-7 text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      </div>
                    ) : turn.images.length === 0 ? (
                      // Loading skeleton
                      <div className={cn("grid gap-2", n > 1 ? "grid-cols-2" : "grid-cols-1")}>
                        {Array.from({ length: n }).map((_, i) => (
                          <Skeleton
                            key={i}
                            className={cn("w-full rounded-lg", AR_PREVIEW[aspect])}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className={cn("grid gap-2", turn.images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                        {turn.images.map((img) => (
                          <div
                            key={img.id}
                            className="group relative rounded-lg overflow-hidden border border-border bg-card"
                          >
                            <img
                              src={img.dataUrl}
                              alt={img.prompt}
                              className="w-full h-auto block"
                            />
                            {/* Hover overlay with actions */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end gap-1 p-2">
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
                                onClick={() => {
                                  deleteGeneratedImage(img.id);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            {/* Badge */}
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="text-[9px] bg-black/60 text-white backdrop-blur">
                                {img.backend}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Turn actions */}
                    {turn.images.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(turn.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          onClick={() => handleGenerate(turn.prompt)}
                          className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Regenerate
                        </button>
                        <button
                          onClick={() => handleDeleteTurn(turn)}
                          className="text-[10px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Streaming loading indicator */}
          {loading && turns[turns.length - 1]?.images.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-12">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating — this may take 10-30 seconds…
            </div>
          )}
        </div>
      </div>

      {/* Input bar (chat-style, bottom) */}
      <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur">
        <div className="max-w-3xl mx-auto p-3 sm:p-4">
          <div className="relative flex items-end gap-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe an image to generate…"
              rows={1}
              className="resize-none min-h-[44px] max-h-32 flex-1 text-base md:text-sm pr-12"
              disabled={loading}
            />
            <Button
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              size="icon"
              className="h-11 w-11 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Press Enter to generate · Shift+Enter for new line · {AR_DIMENSIONS[aspect]} · {selectedModel?.displayName}
          </p>
        </div>
      </div>
    </div>
  );
}
