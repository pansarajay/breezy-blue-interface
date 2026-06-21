import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Ticket, ArrowRight, Download, XCircle, CheckCircle2 } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "My Bookings — BusGo" }, { name: "description", content: "View, manage and download your bus tickets." }] }),
  component: BookingsPage,
});

const MOCK = [
  { id: "BG9X4K2A", from: "Bengaluru", to: "Mumbai", operator: "VRL Travels", date: "2026-06-25", time: "21:30", seats: ["L1S", "L2S"], status: "Confirmed", amount: 3148 },
  { id: "BG7T1B9C", from: "Delhi", to: "Jaipur", operator: "RedBus Express", date: "2026-07-02", time: "07:00", seats: ["U3"], status: "Confirmed", amount: 419 },
  { id: "BG3Q8M5N", from: "Pune", to: "Goa", operator: "Orange Tours", date: "2026-05-10", time: "20:00", seats: ["L4", "L5"], status: "Completed", amount: 1890 },
  { id: "BG2P1L9F", from: "Hyderabad", to: "Chennai", operator: "SRS Travels", date: "2026-04-18", time: "23:00", seats: ["U2S"], status: "Cancelled", amount: 0 },
];

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;

function BookingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Upcoming");

  const filtered = MOCK.filter((b) =>
    tab === "Upcoming" ? b.status === "Confirmed" : tab === "Completed" ? b.status === "Completed" : b.status === "Cancelled"
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">My bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">All your tickets in one place.</p>
          </div>
          <Button asChild variant="hero" size="sm">
            <Link to="/">Book new trip <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="mt-6 inline-flex rounded-lg border border-border bg-card p-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${tab === t ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-elevated">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{b.from}</h3>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="font-semibold">{b.to}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{b.operator} · {new Date(b.date).toDateString()} · {b.time}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Booking #{b.id} · Seats: {b.seats.join(", ")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={b.status} />
                  <div className="mt-2 text-sm font-bold">₹{b.amount}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Ticket</Button>
                {b.status === "Confirmed" && <Button variant="ghost" size="sm" className="text-destructive">Cancel booking</Button>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              No {tab.toLowerCase()} bookings yet.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    Confirmed: { cls: "bg-success/10 text-success", icon: <CheckCircle2 className="h-3 w-3" /> },
    Completed: { cls: "bg-primary/10 text-primary", icon: <CheckCircle2 className="h-3 w-3" /> },
    Cancelled: { cls: "bg-destructive/10 text-destructive", icon: <XCircle className="h-3 w-3" /> },
  };
  const v = map[status] ?? map.Confirmed;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${v.cls}`}>{v.icon}{status}</span>;
}
