import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Calendar, MapPin, Search, Shield, Ticket, Headphones, Wallet, Star } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { CITIES } from "@/lib/bus-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BusGo — Book Bus Tickets Online" },
      { name: "description", content: "Search, compare and book bus tickets across India with live seat selection." },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState("Bengaluru");
  const [to, setTo] = useState("Mumbai");
  const [date, setDate] = useState(today);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-32 sm:px-6 lg:pt-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Star className="h-3 w-3 fill-current" /> Trusted by 2M+ travellers
            </span>
            <h1 className="mt-5 text-4xl font-bold text-white sm:text-6xl">
              Book bus tickets <br /> the smarter way.
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
              Compare 5,000+ routes, pick your exact seat, and get an instant e-ticket — all in under a minute.
            </p>
          </div>

          {/* Search card */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/search", search: { from, to, date } });
            }}
            className="relative mt-10 grid gap-3 rounded-2xl bg-card p-4 shadow-elevated sm:p-6 md:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <Field icon={<MapPin className="h-4 w-4 text-primary" />} label="From">
              <select value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field icon={<MapPin className="h-4 w-4 text-accent" />} label="To">
              <select value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field icon={<Calendar className="h-4 w-4 text-primary" />} label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none" />
            </Field>
            <Button type="submit" variant="hero" size="lg" className="md:h-auto">
              <Search className="h-4 w-4" /> Search Buses
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> Secure payments</span>
            <span className="flex items-center gap-1.5"><Ticket className="h-4 w-4" /> Instant e-tickets</span>
            <span className="flex items-center gap-1.5"><Headphones className="h-4 w-4" /> 24/7 support</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Why travel with BusGo</h2>
          <p className="mt-3 text-muted-foreground">Built for travellers, refined for comfort.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: <Ticket className="h-5 w-5" />, title: "Lowest fares", desc: "Compare and grab the best price from 250+ operators." },
            { icon: <Shield className="h-5 w-5" />, title: "Safe & verified", desc: "Verified operators with real ratings & live tracking." },
            { icon: <Wallet className="h-5 w-5" />, title: "Easy refunds", desc: "Fast cancellations and instant refunds to source." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular routes */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">Popular routes</h2>
          <Link to="/search" search={{ from: "Bengaluru", to: "Mumbai", date: today }} className="text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Bengaluru", "Mumbai", "from ₹749"],
            ["Delhi", "Jaipur", "from ₹399"],
            ["Hyderabad", "Chennai", "from ₹599"],
            ["Pune", "Goa", "from ₹899"],
          ].map(([f, t, p]) => (
            <Link
              key={f + t}
              to="/search"
              search={{ from: f, to: t, date: today }}
              className="group rounded-xl border border-border bg-gradient-card p-5 transition-all hover:border-primary/40 hover:shadow-soft"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>{f}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                <span>{t}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{p}</div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 transition-colors focus-within:border-primary">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        {children}
      </div>
    </label>
  );
}
