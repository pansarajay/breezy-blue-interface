import { createFileRoute } from "@tanstack/react-router";
import { Bus, Users, Ticket, IndianRupee, TrendingUp, Plus, MoreVertical } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { BUSES } from "@/lib/bus-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — BusGo" }, { name: "description", content: "Manage buses, routes, schedules and bookings." }] }),
  component: Admin,
});

function Admin() {
  const stats = [
    { label: "Total bookings", value: "12,438", delta: "+12.4%", icon: <Ticket className="h-4 w-4" /> },
    { label: "Active buses", value: "184", delta: "+3", icon: <Bus className="h-4 w-4" /> },
    { label: "Registered users", value: "42,901", delta: "+8.2%", icon: <Users className="h-4 w-4" /> },
    { label: "Revenue (mo)", value: "₹18.4L", delta: "+15.7%", icon: <IndianRupee className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Admin dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Operational overview for the BusGo fleet.</p>
          </div>
          <Button variant="hero" size="sm"><Plus className="h-4 w-4" /> Add new bus</Button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{s.icon}</span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                  <TrendingUp className="h-3 w-3" /> {s.delta}
                </span>
              </div>
              <div className="mt-4 text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Bookings this week</h3>
              <span className="text-xs text-muted-foreground">Mon — Sun</span>
            </div>
            <div className="mt-6 flex h-44 items-end gap-3">
              {[40, 65, 50, 80, 95, 70, 88].map((v, i) => (
                <div key={i} className="group relative flex-1">
                  <div className="rounded-t-md bg-gradient-hero transition-all group-hover:opacity-90" style={{ height: `${v}%` }} />
                  <div className="mt-2 text-center text-[11px] text-muted-foreground">{["M","T","W","T","F","S","S"][i]}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-semibold">Top routes</h3>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ["Bengaluru → Mumbai", 92],
                ["Delhi → Jaipur", 78],
                ["Pune → Goa", 65],
                ["Hyderabad → Chennai", 54],
              ].map(([r, v]) => (
                <div key={r as string}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{r}</span>
                    <span className="text-muted-foreground">{v}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-hero" style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bus management table */}
        <div className="mt-6 rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h3 className="font-semibold">Fleet management</h3>
            <Button variant="outline" size="sm">Export CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-4">Bus</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4">Seats</th>
                  <th className="p-4">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {BUSES.map((b) => (
                  <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4">
                      <div className="font-semibold">{b.operator}</div>
                      <div className="text-xs text-muted-foreground">{b.busNumber} · {b.type}</div>
                    </td>
                    <td className="p-4">{b.from} → {b.to}</td>
                    <td className="p-4">{b.departure} – {b.arrival}</td>
                    <td className="p-4">{b.totalSeats - b.seatsLeft}/{b.totalSeats}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
