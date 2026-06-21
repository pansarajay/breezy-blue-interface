import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CreditCard, Smartphone, Wallet, ShieldCheck, ArrowLeft } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { getBus } from "@/lib/bus-data";

const search = z.object({
  busId: z.string(),
  seats: z.string(),
  date: z.string(),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Checkout — BusGo" }, { name: "description", content: "Add passenger details and complete your booking securely." }] }),
  component: Checkout,
});

type Passenger = { name: string; age: string; gender: "M" | "F" };

function Checkout() {
  const { busId, seats, date } = Route.useSearch();
  const navigate = useNavigate();
  const bus = getBus(busId);
  const seatList = seats.split(",").filter(Boolean);

  const [pax, setPax] = useState<Passenger[]>(seatList.map(() => ({ name: "", age: "", gender: "M" })));
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [method, setMethod] = useState<"upi" | "card" | "wallet" | "netbanking">("upi");

  if (!bus) return null;
  const subtotal = seatList.length * bus.fare;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const bookingId = "BG" + Math.random().toString(36).slice(2, 8).toUpperCase();
    navigate({ to: "/confirmation/$bookingId", params: { bookingId }, search: { busId, seats, date } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link to="/bus/$busId" params={{ busId }} search={{ date }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to seat selection
        </Link>

        <form onSubmit={submit} className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Section title="Passenger details">
              <div className="space-y-4">
                {seatList.map((seat: string, i: number) => (
                  <div key={seat} className="rounded-xl border border-border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold">Seat {seat}</span>
                      <span className="text-xs text-muted-foreground">Passenger {i + 1}</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_100px_140px]">
                      <Input required placeholder="Full name" value={pax[i].name} onChange={(v) => setPax((p) => p.map((x, k) => k === i ? { ...x, name: v } : x))} />
                      <Input required type="number" min={1} max={120} placeholder="Age" value={pax[i].age} onChange={(v) => setPax((p) => p.map((x, k) => k === i ? { ...x, age: v } : x))} />
                      <div className="flex rounded-md border border-border bg-card p-0.5">
                        {(["M", "F"] as const).map((g) => (
                          <button key={g} type="button"
                            onClick={() => setPax((p) => p.map((x, k) => k === i ? { ...x, gender: g } : x))}
                            className={`flex-1 rounded text-sm font-medium py-1.5 ${pax[i].gender === g ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                          >{g === "M" ? "Male" : "Female"}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Contact details">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input required type="email" placeholder="Email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} />
                <Input required type="tel" placeholder="Mobile number" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Tickets and updates will be sent here.</p>
            </Section>

            <Section title="Payment method">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { id: "upi", label: "UPI", icon: <Smartphone className="h-4 w-4" /> },
                  { id: "card", label: "Card", icon: <CreditCard className="h-4 w-4" /> },
                  { id: "wallet", label: "Wallet", icon: <Wallet className="h-4 w-4" /> },
                  { id: "netbanking", label: "Net Banking", icon: <ShieldCheck className="h-4 w-4" /> },
                ].map((m) => (
                  <button key={m.id} type="button" onClick={() => setMethod(m.id as never)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${method === m.id ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </Section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-semibold">{bus.operator}</h3>
              <p className="text-xs text-muted-foreground">{bus.type}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div><div className="font-semibold">{bus.departure}</div><div className="text-muted-foreground">{bus.from}</div></div>
                <div className="text-center text-muted-foreground">{bus.duration}</div>
                <div className="text-right"><div className="font-semibold">{bus.arrival}</div><div className="text-muted-foreground">{bus.to}</div></div>
              </div>
              <div className="my-4 border-t border-border" />
              <div className="space-y-1.5 text-sm">
                <Row label={`Seats × ${seatList.length}`} value={`₹${subtotal}`} />
                <Row label="Taxes & fees" value={`₹${tax}`} />
                <div className="my-2 border-t border-border" />
                <Row label="Total" value={`₹${total}`} bold />
              </div>
              <Button type="submit" variant="hero" className="mt-4 w-full">Pay ₹{total} securely</Button>
              <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-success" /> 256-bit secure payment by Razorpay
              </p>
            </div>
          </aside>
        </form>
      </div>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Input({ value, onChange, ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & { value: string; onChange: (v: string) => void }) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
    />
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : "text-muted-foreground"}`}>
      <span>{label}</span><span className={bold ? "text-foreground" : ""}>{value}</span>
    </div>
  );
}
