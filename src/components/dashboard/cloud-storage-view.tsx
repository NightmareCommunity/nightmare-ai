"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Cloud, Sparkles } from "lucide-react";

export function CloudStorageView() {
  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-3xl mx-auto p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Folder className="w-6 h-6 text-primary" />
            Files
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cloud storage for your generated assets and uploads.
          </p>
        </div>

        <Card className="border-dashed glass">
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Cloud className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Cloud storage coming soon</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Persistent cloud storage with file management, sharing, and
              thumbnails is on the roadmap. Your generated images and
              presentations are currently stored locally in this browser.
            </p>
            <Button variant="outline" className="mt-5 h-10" disabled>
              <Sparkles className="w-4 h-4 mr-2" />
              Coming soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
