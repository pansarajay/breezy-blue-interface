import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Armchair, Steering, Info } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { buildSeatMap, getBus, type SeatStatus } from "@/lib/bus-data";

const Steer = Steering ?? (() => null);

const searchSchema = z.object({ date: z.string().default(new Date().toISOString().slice(0, 10)) });

export const Route = createFileRoute("/bus/$busId")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [
      { title: `Select seats — Bus ${params.busId} — BusGo` },
      { name: "description", content: "Pick your seat with live availability and book instantly." },
    ],
  }),
  component: BusDetailPage,
});

function BusDetailPage() {
  const { busId } = Route.useParams();
  const { date } = Route.useSearch();
  const navigate = useNavigate();
  const bus = getBus(busId);
  const [selected, setSelected] = useState<string[]>([]);

  if (!bus) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Bus not found</h1>
          <Button asChild className="mt-4"><Link to="/search" search={{ from: "Bengaluru", to: "Mumbai", date }}>Back to search</Link></Button>
        </div>
      </div>
    );
  }

  const seats = useMemo(() => buildSeatMap(bus), [bus]);
  const toggle = (id: string, status: SeatStatus) => {
    if (status === "booked" || status === "female") return;
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 6 ? [...s, id] : s));
  };

  const total = selected.length * bus.fare;
  const lower = seats.filter((s) => s.deck === "lower");
  const upper = seats.filter((s) => s.deck === "upper");

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link to="/search" search={{ from: bus.from, to: bus.to, date }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to results
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Bus header */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">{bus.operator}</h1>
                  <p className="text-sm text-muted-foreground">{bus.type} · {bus.busNumber}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Starting at</div>
                  <div className="text-2xl font-bold">₹{bus.fare}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <Stat label="Departure" value={`${bus.departure} · ${bus.from}`} />
                <Stat label="Duration" value={bus.duration} />
                <Stat label="Arrival" value={`${bus.arrival} · ${bus.to}`} />
              </div>
            </div>

            {/* Seat map */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-semibold">Select your seats</h2>
              <Legend />

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Deck title="Lower Deck" seats={lower} selected={selected} onToggle={toggle} />
                <Deck title="Upper Deck" seats={upper} selected={selected} onToggle={toggle} />
              </div>
            </div>

            {/* Boarding & dropping */}
            <div className="grid gap-4 md:grid-cols-2">
              <Points title="Boarding points" points={bus.boardingPoints} />
              <Points title="Dropping points" points={bus.droppingPoints} />
            </div>
          </div>

          {/* Sidebar summary */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-semibold">Fare summary</h3>
              <div className="mt-4 space-y-2 text-sm">
                <Row label={`Seats × ${selected.length}`} value={`₹${total}`} />
                <Row label="Taxes & fees" value={`₹${Math.round(total * 0.05)}`} />
                <div className="my-2 border-t border-border" />
                <Row label="Total" value={`₹${total + Math.round(total * 0.05)}`} bold />
              </div>
              {selected.length > 0 && (
                <div className="mt-3 rounded-md bg-primary/10 p-2 text-xs text-primary">
                  Selected: {selected.join(", ")}
                </div>
              )}
              <Button
                variant="hero"
                className="mt-4 w-full"
                disabled={selected.length === 0}
                onClick={() =>
                  navigate({ to: "/checkout", search: { busId: bus.id, seats: selected.join(","), date } })
                }
              >
                Continue · ₹{total + Math.round(total * 0.05)}
              </Button>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Info className="h-3 w-3" /> Seats are held for 8 minutes after selection.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Deck({ title, seats, selected, onToggle }: {
  title: string;
  seats: ReturnType<typeof buildSeatMap>;
  selected: string[];
  onToggle: (id: string, status: SeatStatus) => void;
}) {
  const maxRow = Math.max(...seats.map((s) => s.row));
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="relative mx-auto w-full max-w-[280px] rounded-lg border-2 border-border p-3">
        <div className="mb-3 flex justify-end">
          <Steer className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: maxRow }, (_, i) => i + 1).map((row) => {
            const rowSeats = seats.filter((s) => s.row === row);
            return (
              <div key={row} className="grid grid-cols-[1fr_1fr_8px_1fr] gap-1.5">
                {[1, 2].map((c) => {
                  const s = rowSeats.find((x) => x.col === c);
                  if (!s) return <div key={c} />;
                  return <Seat key={s.id} seat={s} selected={selected.includes(s.id)} onClick={() => onToggle(s.id, s.status)} />;
                })}
                <div />
                {(() => {
                  const s = rowSeats.find((x) => x.col === 3);
                  if (!s) return <div />;
                  return <Seat seat={s} selected={selected.includes(s.id)} onClick={() => onToggle(s.id, s.status)} />;
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Seat({ seat, selected, onClick }: { seat: { id: string; status: SeatStatus }; selected: boolean; onClick: () => void }) {
  const base = "flex h-9 items-center justify-center rounded-md text-[10px] font-semibold transition-all";
  let cls = "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary cursor-pointer";
  if (seat.status === "booked") cls = "bg-muted text-muted-foreground/40 cursor-not-allowed";
  else if (seat.status === "female") cls = "bg-pink-100 text-pink-600 border border-pink-300 cursor-not-allowed";
  if (selected) cls = "bg-primary text-primary-foreground border border-primary shadow-soft";
  return (
    <button type="button" onClick={onClick} className={`${base} ${cls}`} aria-label={`Seat ${seat.id}`}>
      <Armchair className="mr-0.5 h-3 w-3" /> {seat.id}
    </button>
  );
}

function Legend() {
  const items = [
    { c: "bg-card border border-border", label: "Available" },
    { c: "bg-primary", label: "Selected" },
    { c: "bg-muted", label: "Booked" },
    { c: "bg-pink-100 border border-pink-300", label: "Female" },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded ${i.c}`} /> {i.label}
        </span>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : "text-muted-foreground"}`}>
      <span>{label}</span><span className={bold ? "text-foreground" : ""}>{value}</span>
    </div>
  );
}

function Points({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {points.map((p) => <li key={p} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{p}</li>)}
      </ul>
    </div>
  );
}
