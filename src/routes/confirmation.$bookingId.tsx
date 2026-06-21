import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, Download, Mail, Calendar, MapPin, Ticket } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { getBus } from "@/lib/bus-data";

const search = z.object({ busId: z.string(), seats: z.string(), date: z.string() });

export const Route = createFileRoute("/confirmation/$bookingId")({
  validateSearch: search,
  head: ({ params }) => ({
    meta: [{ title: `Booking ${params.bookingId} confirmed — BusGo` }, { name: "description", content: "Your bus ticket is confirmed." }],
  }),
  component: Confirmation,
});

function Confirmation() {
  const { bookingId } = Route.useParams();
  const { busId, seats, date } = Route.useSearch();
  const bus = getBus(busId);
  if (!bus) return null;
  const seatList = seats.split(",").filter(Boolean);
  const total = seatList.length * bus.fare + Math.round(seatList.length * bus.fare * 0.05);

  // simple QR placeholder (square pattern based on hash)
  const qrCells = Array.from({ length: 21 * 21 }, (_, i) => {
    const h = (i * 9301 + bookingId.charCodeAt(i % bookingId.length) * 49297) % 233280;
    return h % 2 === 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">Booking confirmed!</h1>
          <p className="mt-2 text-muted-foreground">Your e-ticket has been emailed to you.</p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
          {/* Ticket header */}
          <div className="bg-gradient-hero p-6 text-primary-foreground">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs opacity-80">Booking ID</div>
                <div className="text-lg font-bold">{bookingId}</div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-80">Total paid</div>
                <div className="text-lg font-bold">₹{total}</div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold">{bus.operator}</div>
                <div className="text-xs text-muted-foreground">{bus.type} · {bus.busNumber}</div>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-xl border border-dashed border-border p-4 text-sm">
                <div>
                  <div className="text-lg font-bold">{bus.departure}</div>
                  <div className="text-xs text-muted-foreground">{bus.from}</div>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  <div>{bus.duration}</div>
                  <div className="my-1 h-px w-full bg-border" />
                  <div>direct</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{bus.arrival}</div>
                  <div className="text-xs text-muted-foreground">{bus.to}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info icon={<Calendar className="h-4 w-4" />} label="Travel date" value={new Date(date).toDateString()} />
                <Info icon={<Ticket className="h-4 w-4" />} label="Seats" value={seatList.join(", ")} />
                <Info icon={<MapPin className="h-4 w-4" />} label="Boarding" value={bus.boardingPoints[0]} />
                <Info icon={<MapPin className="h-4 w-4" />} label="Dropping" value={bus.droppingPoints[0]} />
              </div>
            </div>

            {/* QR */}
            <div className="flex flex-col items-center justify-center">
              <div className="grid h-32 w-32 grid-cols-[repeat(21,minmax(0,1fr))] gap-px overflow-hidden rounded-md border border-border bg-card p-1">
                {qrCells.map((on, i) => (
                  <div key={i} className={on ? "bg-foreground" : "bg-card"} />
                ))}
              </div>
              <span className="mt-2 text-[10px] text-muted-foreground">Scan at boarding</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border bg-muted/40 p-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Download PDF</Button>
              <Button variant="outline" size="sm"><Mail className="h-4 w-4" /> Email ticket</Button>
            </div>
            <Button asChild variant="hero" size="sm"><Link to="/bookings">View my bookings</Link></Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
