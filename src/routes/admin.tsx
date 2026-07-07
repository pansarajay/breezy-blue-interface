import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Bus, Users, Ticket, IndianRupee, TrendingUp, Plus, Trash2, Download, AlertTriangle, Loader2 } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — BusGo" }, { name: "description", content: "Manage buses, routes, schedules and bookings." }] }),
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Bus Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [busName, setBusName] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [busType, setBusType] = useState("AC Sleeper");
  const [totalSeats, setTotalSeats] = useState(36);
  const [adding, setAdding] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await api.get<any>("/admin/stats");
      const chartsRes = await api.get<any>("/admin/charts");
      const busesRes = await api.get<any[]>("/buses");
      
      setStats(statsRes);
      setCharts(chartsRes);
      setBuses(busesRes);
    } catch (err: any) {
      setError(err.message || "Failed to load admin stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Authenticate Admin
    const userStr = localStorage.getItem("busgo_user");
    if (!userStr) {
      toast.error("Please log in as admin to access the dashboard.");
      navigate({ to: "/login" });
      return;
    }
    
    try {
      const parsed = JSON.parse(userStr);
      if (parsed.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate({ to: "/" });
        return;
      }
      setUser(parsed);
    } catch {
      navigate({ to: "/login" });
      return;
    }

    fetchAdminData();
  }, []);

  const handleExportReport = async (reportType: "revenue" | "occupancy", format: "excel" | "csv") => {
    try {
      toast.loading(`Generating ${reportType} report...`, { id: "report_export" });
      const blob = await api.getBlob(`/admin/reports/${reportType}?format=${format}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().slice(0, 10)}.${format === "excel" ? "xlsx" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully!", { id: "report_export" });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report.", { id: "report_export" });
    }
  };

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busName || !busNumber) {
      toast.error("Please fill in all bus details.");
      return;
    }

    setAdding(true);
    try {
      await api.post("/buses", {
        bus_name: busName,
        bus_number: busNumber,
        bus_type: busType,
        total_seats: Number(totalSeats),
        amenities: ["WiFi", "Charging Point", "Water Bottle"]
      });
      toast.success("New bus added to fleet!");
      setBusName("");
      setBusNumber("");
      setShowAddForm(false);
      fetchAdminData(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || "Failed to add bus");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteBus = async (busId: number) => {
    if (!window.confirm("Are you sure you want to delete this bus? All schedules associated with it will be removed.")) return;
    
    try {
      toast.loading("Removing bus...", { id: "delete_bus" });
      await api.delete(`/buses/${busId}`);
      toast.success("Bus deleted from fleet.", { id: "delete_bus" });
      fetchAdminData(); // Refresh
    } catch (err: any) {
      toast.error(err.message || "Failed to delete bus", { id: "delete_bus" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-42 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm">Opening admin console...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-destructive">Unauthorized or Error</h1>
          <p className="mt-2 text-muted-foreground">{error || "Access denied"}</p>
          <Button onClick={() => fetchAdminData()} className="mt-4">Retry Connection</Button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Bookings", value: stats.totalBookings, delta: "+12.4%", icon: <Ticket className="h-4 w-4" /> },
    { label: "Active Buses", value: stats.totalBuses, delta: `Fleet size: ${stats.totalBuses}`, icon: <Bus className="h-4 w-4" /> },
    { label: "Registered Passengers", value: stats.totalUsers, delta: "+8.2%", icon: <Users className="h-4 w-4" /> },
    { label: "Total Revenue", value: `₹${(stats.totalRevenue).toLocaleString()}`, delta: "Simulated Razorpay", icon: <IndianRupee className="h-4 w-4" /> },
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
          <Button variant="hero" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4" /> Add new bus
          </Button>
        </div>

        {/* Add Bus Form Modal Panel */}
        {showAddForm && (
          <form onSubmit={handleAddBus} className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4">
            <h3 className="text-lg font-bold">Add New Bus details</h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Operator Name</label>
                <input required type="text" placeholder="e.g. Orange Tours" value={busName} onChange={(e) => setBusName(e.target.value)} className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Plate Number</label>
                <input required type="text" placeholder="e.g. KA-01-XX-9999" value={busNumber} onChange={(e) => setBusNumber(e.target.value)} className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Bus Type</label>
                <select value={busType} onChange={(e) => setBusType(e.target.value)} className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none">
                  <option>AC Sleeper</option>
                  <option>Non-AC Sleeper</option>
                  <option>AC Seater</option>
                  <option>Non-AC Seater</option>
                  <option>Luxury Coach</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Capacity (Seats)</label>
                <input type="number" min={10} max={60} value={totalSeats} onChange={(e) => setTotalSeats(Number(e.target.value))} className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button type="submit" variant="hero" size="sm" disabled={adding}>
                {adding ? "Adding..." : "Add to fleet"}
              </Button>
            </div>
          </form>
        )}

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
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
              <h3 className="font-semibold">Bookings trend (last 7 days)</h3>
              <span className="text-xs text-muted-foreground">Mon — Sun</span>
            </div>
            <div className="mt-6 flex h-44 items-end gap-3">
              {charts?.dailyStats?.map((v: any, i: number) => {
                const maxVal = Math.max(...charts.dailyStats.map((d: any) => d.bookings)) || 1;
                const percentageHeight = Math.max(8, (v.bookings / maxVal) * 100);
                return (
                  <div key={i} className="group relative flex-1">
                    <div className="rounded-t-md bg-gradient-hero transition-all group-hover:opacity-90" style={{ height: `${percentageHeight}%` }} />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {v.bookings}
                    </div>
                    <div className="mt-2 text-center text-[11px] text-muted-foreground">{v.day}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-semibold">Top routes</h3>
            <div className="mt-4 space-y-3 text-sm">
              {charts?.popularRoutes?.map((r: any) => (
                <div key={r.route}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{r.route}</span>
                    <span className="text-muted-foreground">{r.count} bookings</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-hero" style={{ width: `${r.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bus management table */}
        <div className="mt-6 rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex flex-wrap items-center justify-between border-b border-border p-5 gap-2">
            <h3 className="font-semibold">Fleet management</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportReport("revenue", "csv")}><Download className="h-4 w-4 mr-1" /> Revenue CSV</Button>
              <Button variant="outline" size="sm" onClick={() => handleExportReport("occupancy", "excel")}><Download className="h-4 w-4 mr-1" /> Occupancy Excel</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-4">Bus</th>
                  <th className="p-4">Route ID & Capacity</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {buses.map((b) => (
                  <tr key={b.bus_id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4">
                      <div className="font-semibold">{b.bus_name}</div>
                      <div className="text-xs text-muted-foreground">{b.bus_number}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{b.total_seats} passenger capacity</div>
                    </td>
                    <td className="p-4">{b.bus_type}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${b.status === 'Active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${b.status === 'Active' ? 'bg-success' : 'bg-muted-foreground'}`} /> {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeleteBus(b.bus_id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
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
