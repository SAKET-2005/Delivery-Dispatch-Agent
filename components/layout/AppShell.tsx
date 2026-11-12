"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bot, LayoutDashboard, LogOut, MapPinned, Menu, Truck, X } from "lucide-react";
import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dispatch", label: "AI Dispatch", icon: Bot },
  { href: "/deliveries", label: "Deliveries", icon: Truck },
  { href: "/riders", label: "Riders", icon: MapPinned },
  { href: "/activity", label: "Activity", icon: Activity },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <div
        className={`drawer-backdrop ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <MapPinned size={18} />
          </span>
          <span className="brand-title">
            RouteWise<span className="brand-sub">Chennai delivery hub</span>
          </span>
          <button
            className="mobile-menu"
            style={{ marginLeft: "auto", color: "#cad4de" }}
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="nav-label">Workspace</div>
        <nav className="nav-list">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`nav-link ${path === href ? "active" : ""}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="hub-card">
            <div className="hub-kicker">Dispatch center</div>
            <div className="hub-title">Chennai Hub</div>
            <div className="hub-live">
              <span className="live-dot" />
              Operations live
            </div>
          </div>

          <div className="dispatcher">
            <div className="avatar">AV</div>
            <div style={{ flex: 1 }}>
              <div className="dispatcher-name">Anitha V</div>
              <div className="dispatcher-role">Dispatcher · D01</div>
            </div>
            <button
              className="btn btn-quiet"
              style={{ color: "#97a6b4", padding: 7 }}
              disabled={busy}
              onClick={logout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={19} />
            </button>
            <div className="breadcrumb">
              <span className="hide-mobile">Chennai Hub&nbsp; / &nbsp;</span>
              <span className="crumb-current">
                {links.find((x) => x.href === path)?.label || "Overview"}
              </span>
            </div>
          </div>
          <div className="topbar-meta">
            <span className="topbar-live">
              <span className="live-dot" />
              <span>Live operations</span>
            </span>
            <span className="hide-mobile">Anitha V · D01</span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
