import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { ArrowRight, Bus as BusIcon, Clock, Star, Wifi, Zap, Filter as FilterIcon, Loader2 } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { type Bus } from "@/lib/bus-data";

const searchSchema = z.object({
  from: z.string().default("Bengaluru"),
  to: z.string().default("Mumbai"),
  date: z.string().default(new Date().toISOString().slice(0, 10)),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search Buses — BusGo" }, { name: "description", content: "Compare available buses, filter by type, time, price and book your seat." }] }),
  component: SearchPage,
});

const TYPES = ["AC Sleeper", "Non-AC Sleeper", "AC Seater", "Non-AC Seater", "Luxury Coach"] as const;

function SearchPage() {
  const { from, to, date } = Route.useSearch();
  const [types, setTypes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(2500);
  const [sort, setSort] = useState<"departure" | "price" | "rating">("departure");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuses = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          from,
          to,
          date,
          sort
        });
        
        // Append selected types
        types.forEach(t => queryParams.append('types', t));
        queryParams.append('max_price', maxPrice.toString());

        const data = await api.get<any[]>(`/buses/search?${queryParams.toString()}`);
        
        // Map schedule_id to id so it works with Bus type expected by cards
        const mapped = data.map((item) => ({
          ...item,
          id: String(item.schedule_id) // Using schedule ID for seat selection route parameter
        }));
        
        setResults(mapped);
      } catch (err: any) {
        setError(err.message || "Failed to search buses");
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, [from, to, date, sort, types, maxPrice]);

  const toggleType = (t: string) =>
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search bar summary */}
      <div className="border-b border-border bg-gradient-hero">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3 text-primary-foreground">
            <span className="font-semibold">{from}</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-semibold">{to}</span>
            <span className="hidden text-sm opacity-80 sm:inline">· {new Date(date).toDateString()}</span>
          </div>
          <Button asChild variant="secondary" size="sm"><Link to="/">Modify</Link></Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Filters</h3>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bus type</h4>
            <div className="space-y-2">
              {TYPES.map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={types.includes(t)} onChange={() => toggleType(t)} className="h-4 w-4 accent-[color:var(--primary)]" />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Max price: ₹{maxPrice}</h4>
            <input type="range" min={300} max={2500} step={50} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[color:var(--primary)]" />
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{results.length} buses found</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sort:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-md border border-border bg-card px-2 py-1 text-sm">
                <option value="departure">Departure</option>
                <option value="price">Price (low to high)</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm">Finding active schedules...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((b) => <BusCard key={b.id} bus={b} date={date} />)}
              {results.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                  No buses match the selected filters.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function BusCard({ bus, date }: { bus: Bus; date: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/40 hover:shadow-elevated">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BusIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{bus.operator}</h3>
            <p className="text-xs text-muted-foreground">{bus.type} · {bus.busNumber}</p>
            <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-success/10 px-1.5 py-0.5 text-xs font-semibold text-success">
              <Star className="h-3 w-3 fill-current" /> {bus.rating}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">₹{bus.fare}</div>
          <div className="text-xs text-muted-foreground">{bus.seatsLeft} seats left</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 items-center gap-3 text-sm">
        <div>
          <div className="text-xl font-semibold">{bus.departure}</div>
          <div className="text-xs text-muted-foreground">{bus.from}</div>
        </div>
        <div className="flex flex-col items-center text-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="mt-1">{bus.duration}</span>
          <div className="my-1 h-px w-full bg-border" />
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold">{bus.arrival}</div>
          <div className="text-xs text-muted-foreground">{bus.to}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {bus.amenities.slice(0, 4).map((a) => (
            <span key={a} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              {a === "WiFi" && <Wifi className="h-3 w-3" />}
              {a === "Charging Point" && <Zap className="h-3 w-3" />}
              {a}
            </span>
          ))}
        </div>
        <Button variant="hero" size="sm" asChild>
          <Link to="/bus/$busId" params={{ busId: bus.id }} search={{ date }}>
            Select seats <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
