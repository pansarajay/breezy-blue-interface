import { Link, useLocation } from "@tanstack/react-router";
import { Bus, Menu, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/search", label: "Search" },
  { to: "/bookings", label: "My Bookings" },
  { to: "/admin", label: "Admin" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

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
          {links.map((l) => {
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
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <Link to="/register">
              <User className="h-4 w-4" /> Sign up
            </Link>
          </Button>
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
          {links.map((l) => {
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
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link to="/login">Login</Link>
            </Button>
            <Button variant="hero" size="sm" asChild className="flex-1">
              <Link to="/register">Sign up</Link>
            </Button>
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
