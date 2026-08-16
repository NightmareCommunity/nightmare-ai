"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/browser-singleton";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

interface AuthModalProps {
  mode: "login" | "signup" | null;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Friendly error messages for common Supabase auth errors
function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("password should be at least")) {
    return "Password must be at least 8 characters long.";
  }
  if (lower.includes("unable to validate email address")) {
    return "Please enter a valid email address.";
  }
  if (lower.includes("email rate limit")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (lower.includes("for security purposes, you can only request this after")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return msg;
}

export function AuthModal({ mode, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">(
    mode === "signup" ? "signup" : "login"
  );
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = mode !== null;

  const handleOAuth = async (provider: "google") => {
    setError(null);
    setOauthLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo =
        typeof window !== "undefined"
          ? window.location.origin + "/auth/callback?next=/"
          : undefined;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
      // Browser will redirect to provider — keep loading state until redirect
    } catch (err) {
      const message =
        err instanceof Error ? friendlyError(err.message) : `${provider} sign-in failed`;
      setError(message);
      toast.error(message);
      setOauthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowser();
      const normalizedEmail = email.trim().toLowerCase();

      if (tab === "signup") {
        if (!name.trim()) {
          throw new Error("Please enter your name");
        }
        if (!EMAIL_RE.test(normalizedEmail)) {
          throw new Error("Please enter a valid email address");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        const trimmedName = name.trim();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: trimmedName, name: trimmedName },
            emailRedirectTo:
              typeof window !== "undefined"
                ? window.location.origin + "/auth/callback?next=/"
                : undefined,
          },
        });
        if (signUpError) throw signUpError;

        // Email confirmation is disabled — session is returned immediately
        if (data.session) {
          toast.success("Welcome to NIGHTMARE AI");
          onClose();
        } else {
          toast.success("Account created! Check your email to confirm.");
          onClose();
        }
        return;
      }

      // Login flow
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInError) throw signInError;

      toast.success("Signed in");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Authentication failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || oauthLoading;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {tab === "signup" ? "Create your account" : "Sign in to NIGHTMARE AI"}
          </DialogTitle>
          <DialogDescription>
            {tab === "signup"
              ? "Join the workspace — three AI surfaces, one workspace."
              : "Welcome back. Pick up where you left off."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            if (isLoading) return;
            setTab(v as "login" | "signup");
            setError(null);
          }}
          className="w-full"
        >
          {/* OAuth buttons */}
          <div className="grid grid-cols-1 gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleOAuth("google")}
              className="h-11 w-full"
            >
              {oauthLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <GoogleIcon className="h-4 w-4 mr-2" />
              )}
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or {tab === "signup" ? "sign up" : "sign in"} with email
              </span>
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" disabled={isLoading}>Sign In</TabsTrigger>
            <TabsTrigger value="signup" disabled={isLoading}>Sign Up</TabsTrigger>
          </TabsList>

          {/* Login form */}
          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email-login">Email</Label>
                <Input
                  id="email-login"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwd-login">Password</Label>
                <div className="relative">
                  <Input
                    id="pwd-login"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-xs text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>

          {/* Signup form */}
          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name-signup">Name</Label>
                <Input
                  id="name-signup"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-signup">Email</Label>
                <Input
                  id="email-signup"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwd-signup">Password (min 8 chars)</Label>
                <div className="relative">
                  <Input
                    id="pwd-signup"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-xs text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-[11px] text-muted-foreground text-center mt-2">
          By continuing, you agree to NIGHTMARE AI&apos;s Terms of Service and Privacy Policy.
        </p>
      </DialogContent>
    </Dialog>
  );
}
