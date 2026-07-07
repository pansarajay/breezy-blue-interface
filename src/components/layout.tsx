import { Link, useLocation } from "@tanstack/react-router";
import { Bus, Menu, User, LogOut, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const [user, setUser] = useState<{ full_name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const stored = localStorage.getItem("busgo_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    checkAuth();
    
    window.addEventListener("auth_change", checkAuth);
    return () => window.removeEventListener("auth_change", checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("busgo_token");
    localStorage.removeItem("busgo_user");
    window.dispatchEvent(new Event("auth_change"));
    window.location.href = "/";
  };

  const dynamicLinks = [
    { to: "/", label: "Home" },
    { to: "/search", label: "Search" },
  ];

  if (user) {
    dynamicLinks.push({ to: "/bookings", label: "My Bookings" });
    if (user.role === "admin") {
      dynamicLinks.push({ to: "/admin", label: "Admin Dashboard" });
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-soft">
            <Bus className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">BusGo</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {dynamicLinks.map((l) => {
            const isActive = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "text-primary bg-primary/10"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                {user.role === "admin" ? <ShieldAlert className="h-3.5 w-3.5 text-accent" /> : <User className="h-3.5 w-3.5" />}
                {user.full_name.split(" ")[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/register">
                  <User className="h-4 w-4" /> Sign up
                </Link>
              </Button>
            </>
          )}
        </div>
        <button
          className="rounded-md p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <div className={cn("border-t border-border md:hidden", open ? "block" : "hidden")}>
        <div className="flex flex-col gap-1 px-4 py-3">
          {dynamicLinks.map((l) => {
            const isActive = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  isActive && "text-primary bg-primary/10"
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <div className="mt-2 flex gap-2">
            {user ? (
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex-1 text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4 mr-1 inline" /> Logout
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="hero" size="sm" asChild className="flex-1">
                  <Link to="/register">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
              <Bus className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">BusGo</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            India's modern way to book bus tickets. Safe, fast & reliable.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>About</li><li>Careers</li><li>Press</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Help Center</li><li>Cancellation</li><li>Refund Policy</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Terms</li><li>Privacy</li><li>Cookies</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BusGo. All rights reserved.
      </div>
    </footer>
  );
}
