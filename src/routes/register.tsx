import { createFileRoute, Link } from "@tanstack/react-router";
import { Bus, Mail, Lock, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — BusGo" }, { name: "description", content: "Create your free BusGo account in seconds." }] }),
  component: Register,
});

function Register() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <form className="w-full max-w-sm space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Link to="/" className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero"><Bus className="h-5 w-5 text-primary-foreground" /></div><span className="font-bold">BusGo</span></Link>
          <div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Book buses across India in seconds.</p>
          </div>
          <Field icon={<User className="h-4 w-4" />} label="Full name" placeholder="Your name" />
          <Field icon={<Mail className="h-4 w-4" />} label="Email" type="email" placeholder="you@example.com" />
          <Field icon={<Phone className="h-4 w-4" />} label="Mobile" type="tel" placeholder="+91 98765 43210" />
          <Field icon={<Lock className="h-4 w-4" />} label="Password" type="password" placeholder="Choose a strong password" />
          <p className="text-[11px] text-muted-foreground">By signing up you agree to our Terms and Privacy Policy.</p>
          <Button variant="hero" className="w-full">Create account</Button>
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
