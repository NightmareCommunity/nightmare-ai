"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/browser-singleton";
import { LogoMark } from "@/components/shared/logo-mark";
import Link from "next/link";

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

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Invalid email or password.";
  if (lower.includes("email rate limit")) return "Too many attempts. Wait a minute.";
  if (lower.includes("for security purposes")) return "Too many attempts. Wait a minute.";
  return msg;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseBrowser();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/chat");
    });
    // Check for error param
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setError(decodeURIComponent(err));
      toast.error(decodeURIComponent(err));
    }
  }, [router, supabase]);

  const handleOAuth = async () => {
    setError(null);
    setOauthLoading(true);
    try {
      const redirectTo = window.location.origin + "/auth/callback?next=/chat";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? friendlyError(err.message) : "Google sign-in failed";
      setError(msg);
      toast.error(msg);
      setOauthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      toast.success("Signed in");
      router.replace("/chat");
    } catch (err) {
      const msg = err instanceof Error ? friendlyError(err.message) : "Sign in failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || oauthLoading;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <LogoMark size={48} />
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to NIGHTMARE AI</p>
        </div>

        <div className="space-y-4">
          <Button variant="outline" disabled={isLoading} onClick={handleOAuth} className="h-11 w-full">
            {oauthLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <GoogleIcon className="h-4 w-4 mr-2" />}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" disabled={isLoading} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" disabled={isLoading} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
            <Button type="submit" disabled={isLoading} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
        </p>

        <Link href="/" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3 h-3" /> Back to home
        </Link>
      </div>
    </div>
  );
}
