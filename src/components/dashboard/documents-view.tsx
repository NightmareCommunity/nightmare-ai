"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, UploadCloud } from "lucide-react";

export function DocumentsView() {
  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-3xl mx-auto p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Documents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Long-form document creation and storage.
          </p>
        </div>

        <Card className="border-dashed glass">
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Documents coming soon</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              We&apos;re building a unified document workspace with markdown
              editing, version history, and AI-assisted drafting. In the
              meantime, use chat for drafting and presentations for slides.
            </p>
            <Button
              variant="outline"
              className="mt-5 h-10"
              disabled
              title="coming soon"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload document
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
