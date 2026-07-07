import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bus, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — BusGo" }, { name: "description", content: "Sign in to manage your bus bookings." }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: unknown }>("/auth/login", { email, password });
      localStorage.setItem("busgo_token", res.token);
      localStorage.setItem("busgo_user", JSON.stringify(res.user));
      
      // Dispatch authentication change event
      window.dispatchEvent(new Event("auth_change"));
      
      toast.success("Successfully logged in!");
      
      // Check if there was a redirect or return to home
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid login credentials.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-hero lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur"><Bus className="h-5 w-5" /></div>
            <span className="text-lg font-bold">BusGo</span>
          </Link>
          <div>
            <h2 className="text-4xl font-bold leading-tight">Welcome back.<br />Your seat is waiting.</h2>
            <p className="mt-3 max-w-md text-white/85">Sign in to track bookings, get instant refunds, and save passenger details for faster checkout.</p>
          </div>
          <p className="text-xs text-white/70">© {new Date().getFullYear()} BusGo</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-16">
        <form className="w-full max-w-sm space-y-5" onSubmit={handleSubmit}>
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero"><Bus className="h-5 w-5 text-primary-foreground" /></div><span className="font-bold">BusGo</span></Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your details to continue</p>
          </div>
          <Field icon={<Mail className="h-4 w-4" />} label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field icon={<Lock className="h-4 w-4" />} label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 accent-[color:var(--primary)]" /> Remember me</label>
            <a href="#" className="font-medium text-primary hover:underline">Forgot password?</a>
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ icon, label, ...props }: { icon: React.ReactNode; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 focus-within:border-primary">
        <span className="text-muted-foreground">{icon}</span>
        <input {...props} className="w-full bg-transparent text-sm outline-none" />
      </div>
    </label>
  );
}
