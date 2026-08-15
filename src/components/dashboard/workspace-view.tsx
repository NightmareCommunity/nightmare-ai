"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Globe, BookOpen, Sparkles, ArrowRight } from "lucide-react";

const UPCOMING = [
  {
    icon: Globe,
    title: "Web search",
    body: "Live web search integrated into your chat responses, with source citations.",
  },
  {
    icon: BookOpen,
    title: "Document Q&A",
    body: "Upload PDFs and documents, then ask questions against them with grounded answers.",
  },
  {
    icon: Sparkles,
    title: "Multi-step agents",
    body: "Chain multiple tools together to plan, research, and draft — autonomously.",
  },
];

export function WorkspaceView() {
  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-4xl mx-auto p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            Research Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deep research, document analysis, and multi-step AI agents — coming
            to NIGHTMARE AI.
          </p>
        </div>

        <Card className="border-dashed glass mb-8">
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Research tools coming soon</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
              The Research workspace will bring web search, document Q&A, and
              autonomous agents into a single focused surface. For now, use chat
              for reasoning and presentations for structured outputs.
            </p>
          </CardContent>
        </Card>

        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Upcoming features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {UPCOMING.map((f) => (
            <Card key={f.title} className="glass border-border/60">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.body}
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowRight className="w-3 h-3" />
                  Planned
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
