"use client";
import { useEffect, useState } from "react";
import { useAppStore, type StoredPresentation } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Presentation,
  Sparkles,
  Loader2,
  Download,
  Trash2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { TEMPLATES } from "@/lib/constants";
import { uid } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskState {
  taskId: string | null;
  status: "idle" | "pending" | "running" | "complete" | "error";
  stage?: string;
  percent: number;
  message?: string;
}

export function PresentationsView() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [language, setLanguage] = useState("en");
  const [nSlides, setNSlides] = useState(8);
  const [tone, setTone] = useState("professional");
  const [template, setTemplate] = useState("momentum");
  const [configError, setConfigError] = useState(false);

  const [task, setTask] = useState<TaskState>({
    taskId: null,
    status: "idle",
    percent: 0,
  });
  const [exporting, setExporting] = useState<Record<string, boolean>>({});

  const presentations = useAppStore((s) => s.presentations);
  const addPresentation = useAppStore((s) => s.addPresentation);
  const deletePresentation = useAppStore((s) => s.deletePresentation);
  const addNotification = useAppStore((s) => s.addNotification);
  const user = useAppStore((s) => s.user);

  // Detect if Presenton is unavailable (call /api/presentations/generate with empty body to probe)
  // Simpler: probe via a quick HEAD-style GET to /api/presentations/templates
  useEffect(() => {
    fetch("/api/presentations/templates")
      .then((r) => r.json())
      .then((data) => {
        setConfigError(data?.source === "fallback");
      })
      .catch(() => setConfigError(true));
  }, []);

  // Poll task status while pending/running
  useEffect(() => {
    if (!task.taskId) return;
    if (task.status === "complete" || task.status === "error" || task.status === "idle") {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/presentations/status/${task.taskId}`
        );
        const data = await res.json();
        if (data.status === "complete" || data.status === "completed" || data.status === "success") {
          setTask((t) => ({
            ...t,
            status: "complete",
            percent: 100,
            stage: data.stage || "complete",
          }));
          clearInterval(interval);
          // Save presentation
          const slides = Array.isArray(data.data) ? data.data : [];
          const slideCount =
            slides.length ||
            (data.data && typeof data.data === "object"
              ? Object.keys(data.data as object).length
              : 0) ||
            nSlides;
          const pptxPath =
            (data.data as { pptx_path?: string; pptxPath?: string; download_url?: string })?.pptx_path ||
            (data.data as { pptxPath?: string })?.pptxPath ||
            (data.data as { download_url?: string })?.download_url ||
            undefined;
          const newPres: StoredPresentation = {
            id: uid(),
            title: topic.slice(0, 80) || "Untitled Presentation",
            topic,
            audience,
            language,
            style: tone,
            theme: template,
            slideCount,
            prompt: topic,
            content: data.data ?? slides,
            pptxPath,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          addPresentation(newPres);
          addNotification({
            title: "Presentation ready",
            message: `"${newPres.title}" — ${slideCount} slides`,
            type: "success",
            link: { view: "presentations", id: newPres.id },
          });
          toast.success("Presentation generated");
          // Persist to DB
          try {
            await fetch("/api/presentations-sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ presentation: newPres }),
            });
          } catch {
            // best-effort
          }
        } else if (data.status === "error" || data.error) {
          setTask((t) => ({
            ...t,
            status: "error",
            message: data.error || "Generation failed",
          }));
          clearInterval(interval);
          toast.error(data.error || "Generation failed");
        } else {
          setTask((t) => ({
            ...t,
            status: "running",
            stage: data.stage || t.stage,
            percent: typeof data.percent === "number" ? data.percent : t.percent,
            message: data.message,
          }));
        }
      } catch (err) {
        // ignore transient errors
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [task.taskId, task.status]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    if (configError) {
      toast.error("Presentations are unavailable — set PRESENTON_API_KEY");
      return;
    }
    setTask({
      taskId: null,
      status: "pending",
      percent: 5,
      stage: "queued",
    });
    try {
      const res = await fetch("/api/presentations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: topic,
          instructions: audience ? `Target audience: ${audience}` : undefined,
          n_slides: nSlides,
          language,
          template,
          tone,
          verbosity: "standard",
          mode: "generate",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Generation failed");
      }
      setTask({
        taskId: data.task_id,
        status: "pending",
        percent: data.percent ?? 5,
        stage: data.stage || "queued",
      });
      addNotification({
        title: "Presentation generation started",
        message: `"${topic.slice(0, 50)}"`,
        type: "info",
        link: { view: "presentations" },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Generation failed";
      setTask({
        taskId: null,
        status: "error",
        percent: 0,
        message,
      });
      toast.error(message);
    }
  };

  const handleExport = async (id: string) => {
    setExporting((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch("/api/presentations/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentation_id: id, export_as: "pptx" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Export failed");
      }
      if (data.url || data.download_url) {
        window.open(data.url || data.download_url, "_blank");
        toast.success("Export started — check your downloads");
      } else {
        toast.success("Export requested");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast.error(message);
    } finally {
      setExporting((s) => ({ ...s, [id]: false }));
    }
  };

  const isGenerating =
    task.status === "pending" || task.status === "running";

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-5xl mx-auto p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Presentation className="w-6 h-6 text-primary" />
              Presentation Generator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Powered by Presenton — describe a topic, get a deck.
            </p>
          </div>
        </div>

        {configError && (
          <Card className="border-amber-500/40 bg-amber-500/5 mb-6">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-200">
                  Presentations unavailable
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set <code className="text-amber-200">PRESENTON_API_KEY</code> in your environment to enable generation. You can still browse your existing presentations.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="glass border-border/60">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="The future of AI in healthcare"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audience (optional)</Label>
                <Input
                  id="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Healthcare executives"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="funny">Funny</SelectItem>
                      <SelectItem value="sales_pitch">Sales pitch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Slides</Label>
                  <span className="text-xs text-muted-foreground font-mono">{nSlides}</span>
                </div>
                <Slider
                  value={[nSlides]}
                  onValueChange={(v) => setNSlides(v[0])}
                  min={1}
                  max={30}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={cn(
                        "rounded-md border overflow-hidden text-left transition-colors",
                        template === t.id
                          ? "border-primary ring-1 ring-primary/40"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <img
                        src={t.thumbnail}
                        alt={t.name}
                        className="w-full aspect-video object-cover bg-muted"
                      />
                      <div className="px-1.5 py-1">
                        <p className="text-[11px] font-medium truncate">
                          {t.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim() || configError}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Presentation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Progress + recent presentations */}
          <div className="space-y-4">
            <Card className="glass border-border/60">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Progress
                </h3>
                {task.status === "idle" ? (
                  <p className="text-sm text-muted-foreground">
                    Fill in the form and click Generate to start.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {task.status === "error" ? "Failed" : task.stage || task.status}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {task.percent}%
                      </span>
                    </div>
                    <Progress value={task.percent} className="h-2" />
                    {task.status === "error" && task.message && (
                      <p className="text-xs text-destructive">{task.message}</p>
                    )}
                    {task.status === "complete" && (
                      <p className="text-xs text-primary">
                        Presentation saved. See it in the list below.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass border-border/60">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Your presentations · {presentations.length}
                </h3>
                {presentations.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No presentations yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll">
                    {presentations.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-md border border-border bg-card/40 p-3 flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded bg-primary/15 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {p.slideCount} slides · {p.language} ·{" "}
                            {new Date(p.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={exporting[p.id]}
                            onClick={() => handleExport(p.id)}
                            title="Export PPTX"
                          >
                            {exporting[p.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => {
                              if (confirm("Delete this presentation?")) {
                                deletePresentation(p.id);
                                toast.success("Deleted");
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Skeleton preview when generating */}
        {isGenerating && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Slides preview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: Math.min(nSlides, 8) }).map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-md" />
              ))}
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="text-[11px] text-muted-foreground mt-8 text-center">
          Signed in as {user?.email}. Presentations are stored locally in SQLite.
        </p>
      </div>
    </div>
  );
}
