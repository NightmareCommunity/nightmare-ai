"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Zap, Plus, Search, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

interface ServerPrompt {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export function PromptLibraryView() {
  const localPrompts = useAppStore((s) => s.promptLibrary);
  const addPrompt = useAppStore((s) => s.addPrompt);
  const deletePrompt = useAppStore((s) => s.deletePrompt);

  const [serverPrompts, setServerPrompts] = useState<ServerPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftCategory, setDraftCategory] = useState("General");

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prompt-library");
      if (res.ok) {
        const data = await res.json();
        setServerPrompts(data.prompts || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const all = [
    ...serverPrompts,
    ...localPrompts.map((p) => ({
      ...p,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  ];
  const categories = ["All", ...Array.from(new Set(all.map((p) => p.category)))];
  const filtered = all
    .filter(
      (p) =>
        category === "All" || p.category === category
    )
    .filter(
      (p) =>
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));

  const handleCreate = async () => {
    if (!draftTitle.trim() || !draftContent.trim()) {
      toast.error("Title and content are required");
      return;
    }
    try {
      const res = await fetch("/api/prompt-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle.trim(),
          content: draftContent.trim(),
          category: draftCategory.trim() || "General",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save prompt");
      }
      toast.success("Prompt saved");
      setCreateOpen(false);
      setDraftTitle("");
      setDraftContent("");
      setDraftCategory("General");
      refresh();
    } catch (err) {
      // Fallback: store locally
      addPrompt({
        title: draftTitle.trim(),
        content: draftContent.trim(),
        category: draftCategory.trim() || "General",
      });
      toast.success("Prompt saved locally");
      setCreateOpen(false);
      setDraftTitle("");
      setDraftContent("");
      setDraftCategory("General");
    }
  };

  const handleDelete = async (id: string, isLocal: boolean) => {
    if (isLocal) {
      deletePrompt(id);
      toast.success("Deleted");
      return;
    }
    try {
      const res = await fetch(`/api/prompt-library?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Delete failed");
      }
      toast.success("Deleted");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Copy failed"));
  };

  const localIds = new Set(localPrompts.map((p) => p.id));

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-4xl mx-auto p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Prompt Library
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Reusable prompts synced across your workspace.
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Prompt
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts…"
              className="pl-8"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {categories.map((c) => (
              <Button
                key={c}
                variant={category === c ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(c)}
                className={
                  category === c
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 h-9"
                    : "h-9"
                }
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Loading…
          </p>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed glass">
            <CardContent className="p-12 text-center">
              <Zap className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No prompts yet. Click &quot;New Prompt&quot; to save your first
                reusable prompt.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => {
              const isLocal = localIds.has(p.id);
              return (
                <Card
                  key={p.id}
                  className="glass border-border/60 hover:border-primary/40 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {p.title}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {p.category}
                          </span>
                          {isLocal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              local
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                          {p.content}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(p.content)}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(p.id, isLocal)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Prompt</DialogTitle>
            <DialogDescription>
              Save a reusable prompt template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-title">Title</Label>
              <Input
                id="p-title"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Summarize a research paper"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-content">Content</Label>
              <Textarea
                id="p-content"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Summarize the following paper in 5 bullet points…"
                rows={5}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Category</Label>
              <Input
                id="p-cat"
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                placeholder="General"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
