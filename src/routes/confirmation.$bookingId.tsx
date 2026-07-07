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

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

function Confirmation() {
  const { bookingId } = Route.useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<any>(`/bookings/${bookingId}`);
        setBooking(res);
      } catch (err: any) {
        setError(err.message || "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handleDownloadPdf = async () => {
    try {
      toast.loading("Generating PDF ticket...", { id: "pdf_download" });
      const blob = await api.getBlob(`/tickets/${bookingId}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket_${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF ticket downloaded!", { id: "pdf_download" });
    } catch (err: any) {
      toast.error(err.message || "Failed to download PDF ticket.", { id: "pdf_download" });
    }
  };

  const handleEmailTicket = async () => {
    try {
      toast.loading("Sending ticket email...", { id: "email_ticket" });
      await api.post(`/tickets/${bookingId}/email`);
      toast.success("Ticket emailed successfully!", { id: "email_ticket" });
    } catch (err: any) {
      toast.error(err.message || "Failed to email ticket.", { id: "email_ticket" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
          Booking status loading...
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-destructive">Booking Not Found</h1>
          <p className="mt-2 text-muted-foreground">{error || "Could not retrieve booking details."}</p>
          <Button asChild className="mt-4"><Link to="/">Back to home</Link></Button>
        </div>
      </div>
    );
  }

  const bus = booking.schedule.bus;
  const seatList = booking.passengers.map((p: any) => p.seat_number);
  const total = booking.total_amount;

  // Render a visual QR representation based on booking ID
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
          <p className="mt-2 text-muted-foreground">Your e-ticket is active and registered.</p>
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
                <div className="text-sm font-semibold">{bus.bus_name}</div>
                <div className="text-xs text-muted-foreground">{bus.bus_type} · {bus.bus_number}</div>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-xl border border-dashed border-border p-4 text-sm">
                <div>
                  <div className="text-lg font-bold">{booking.schedule.departure_time}</div>
                  <div className="text-xs text-muted-foreground">{booking.schedule.route.source}</div>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  <div>{Math.floor(booking.schedule.route.duration / 60)}h {booking.schedule.route.duration % 60}m</div>
                  <div className="my-1 h-px w-full bg-border" />
                  <div>direct</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{booking.schedule.arrival_time}</div>
                  <div className="text-xs text-muted-foreground">{booking.schedule.route.destination}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info icon={<Calendar className="h-4 w-4" />} label="Travel date" value={new Date(booking.schedule.travel_date).toDateString()} />
                <Info icon={<Ticket className="h-4 w-4" />} label="Seats" value={seatList.join(", ")} />
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
              <Button variant="outline" size="sm" onClick={handleDownloadPdf}><Download className="h-4 w-4" /> Download PDF</Button>
              <Button variant="outline" size="sm" onClick={handleEmailTicket}><Mail className="h-4 w-4" /> Email ticket</Button>
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
