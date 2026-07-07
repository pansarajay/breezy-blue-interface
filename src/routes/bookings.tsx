import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket, ArrowRight, Download, XCircle, CheckCircle2 } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "My Bookings — BusGo" }, { name: "description", content: "View, manage and download your bus tickets." }] }),
  component: BookingsPage,
});

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;

function BookingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<any[]>("/bookings/my");
      setBookings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking and request a refund?")) return;
    try {
      toast.loading("Processing cancellation request...", { id: "cancel_booking" });
      await api.post(`/bookings/${bookingId}/cancel`);
      toast.success("Booking cancelled. Refund transaction initiated.", { id: "cancel_booking" });
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || "Cancellation failed.", { id: "cancel_booking" });
    }
  };

  const handleDownloadPdf = async (bookingId: string) => {
    try {
      toast.loading("Generating ticket layout...", { id: "pdf_download" });
      const blob = await api.getBlob(`/tickets/${bookingId}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket_${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Ticket downloaded successfully!", { id: "pdf_download" });
    } catch (err: any) {
      toast.error(err.message || "PDF download failed.", { id: "pdf_download" });
    }
  };

  const filtered = bookings.filter((b) => {
    if (tab === "Upcoming") return b.booking_status === "Confirmed";
    if (tab === "Completed") return b.booking_status === "Completed";
    return b.booking_status === "Cancelled" || b.booking_status === "Refunded";
  });

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
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading bookings history...</div>
          ) : error ? (
            <div className="text-center py-10 text-destructive">{error}</div>
          ) : (
            filtered.map((b) => {
              const bus = b.schedule.bus;
              const seatsList = b.passengers.map((p: any) => p.seat_number);
              return (
                <div key={b.booking_id} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-elevated">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Ticket className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{b.schedule.route.source}</h3>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <h3 className="font-semibold">{b.schedule.route.destination}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">{bus.bus_name} · {new Date(b.schedule.travel_date).toDateString()} · {b.schedule.departure_time}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Booking #{b.booking_id} · Seats: {seatsList.join(", ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={b.booking_status} />
                      <div className="mt-2 text-sm font-bold">₹{b.total_amount}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(b.booking_id)}><Download className="h-4 w-4" /> Ticket PDF</Button>
                    {b.booking_status === "Confirmed" && (
                      <Button variant="ghost" size="sm" onClick={() => handleCancelBooking(b.booking_id)} className="text-destructive hover:bg-destructive/10">
                        Cancel booking
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {!loading && !error && filtered.length === 0 && (
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
    Refunded: { cls: "bg-info/10 text-info", icon: <XCircle className="h-3 w-3" /> },
  };
  const v = map[status] ?? map.Confirmed;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${v.cls}`}>{v.icon}{status}</span>;
}
