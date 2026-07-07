import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bus, Mail, Lock, User, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — BusGo" }, { name: "description", content: "Create your free BusGo account in seconds." }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !mobile || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: unknown }>("/auth/register", {
        full_name: fullName,
        email,
        mobile_number: mobile,
        password
      });
      
      localStorage.setItem("busgo_token", res.token);
      localStorage.setItem("busgo_user", JSON.stringify(res.user));
      
      // Dispatch authentication change event
      window.dispatchEvent(new Event("auth_change"));
      
      toast.success("Account created successfully!");
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating account.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <form className="w-full max-w-sm space-y-4" onSubmit={handleSubmit}>
          <Link to="/" className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero"><Bus className="h-5 w-5 text-primary-foreground" /></div><span className="font-bold">BusGo</span></Link>
          <div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Book buses across India in seconds.</p>
          </div>
          <Field icon={<User className="h-4 w-4" />} label="Full name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Field icon={<Mail className="h-4 w-4" />} label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field icon={<Phone className="h-4 w-4" />} label="Mobile" type="tel" placeholder="+91 98765 43210" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <Field icon={<Lock className="h-4 w-4" />} label="Password" type="password" placeholder="Choose a strong password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">By signing up you agree to our Terms and Privacy Policy.</p>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have one? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-hero lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-primary-foreground">
          <h2 className="text-4xl font-bold leading-tight">Join 2M+ travellers booking smarter.</h2>
          <p className="mt-3 max-w-md text-white/85">Lowest fares, verified operators, and instant e-tickets — every time.</p>
        </div>
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
