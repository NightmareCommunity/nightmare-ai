"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export function SettingsView() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const user = useAppStore((s) => s.user);

  const { theme, setTheme } = useTheme();

  const [creativity, setCreativity] = useState(settings.creativity);
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel);
  const [responseLength, setResponseLength] = useState(settings.responseLength);
  const [streaming, setStreaming] = useState(settings.streaming);

  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync from store updates
  useEffect(() => {
    setCreativity(settings.creativity);
    setSelectedModel(settings.selectedModel);
    setResponseLength(settings.responseLength);
    setStreaming(settings.streaming);
  }, [settings]);

  const handleSaveChat = () => {
    updateSettings({
      creativity,
      selectedModel,
      responseLength,
      streaming,
    });
    toast.success("Chat settings saved");
  };

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      if (newPwd && newPwd !== confirmPwd) {
        throw new Error("Passwords do not match");
      }
      const patch: { name?: string; avatarUrl?: string } = {};
      if (name && name !== user?.name) patch.name = name;
      if (avatarUrl !== (user?.avatarUrl || "")) patch.avatarUrl = avatarUrl;
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update profile");
      }
      // Optionally update local store user
      const { login } = useAppStore.getState();
      if (user) {
        login({
          ...user,
          name: name || user.name,
          avatarUrl: avatarUrl || undefined,
        });
      }
      // Clear password fields
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      toast.success("Account updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-3xl mx-auto p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your NIGHTMARE AI workspace.
          </p>
        </div>

        {/* Appearance */}
        <Card className="glass border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>How NIGHTMARE AI looks to you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-xs text-muted-foreground">
                  Dark or light mode
                </p>
              </div>
              <Select
                value={theme || "dark"}
                onValueChange={(v) => setTheme(v)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Collapse sidebar
                </Label>
                <p className="text-xs text-muted-foreground">
                  Compact sidebar with just icons
                </p>
              </div>
              <Switch
                checked={sidebarCollapsed}
                onCheckedChange={setSidebarCollapsed}
              />
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="glass border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Chat</CardTitle>
            <CardDescription>
              Defaults applied to new conversations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Recommended)</SelectItem>
                  <SelectItem value="meta/llama-3.1-8b-instruct">
                    Llama 3.1 8B (Fast)
                  </SelectItem>
                  <SelectItem value="meta/llama-3.3-70b-instruct">
                    Llama 3.3 70B (Recommended)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Creativity</Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {creativity}
                </span>
              </div>
              <Slider
                value={[creativity]}
                onValueChange={(v) => setCreativity(v[0])}
                min={0}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Response length</Label>
              <Select
                value={responseLength}
                onValueChange={(v) =>
                  setResponseLength(v as "concise" | "standard" | "detailed")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Streaming</Label>
                <p className="text-xs text-muted-foreground">
                  Stream tokens as they arrive
                </p>
              </div>
              <Switch checked={streaming} onCheckedChange={setStreaming} />
            </div>
            <Button
              onClick={handleSaveChat}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10"
            >
              <Save className="w-4 h-4 mr-2" />
              Save chat settings
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="glass border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>
              Update your profile and password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="opacity-70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-medium">Change password</p>
              <Input
                type="password"
                placeholder="Current password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                autoComplete="current-password"
              />
              <Input
                type="password"
                placeholder="New password (min 8 chars)"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button
              onClick={handleSaveAccount}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving…" : "Save account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
