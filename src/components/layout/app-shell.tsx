import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";

import { ConnectionStatus } from "@/components/realtime/connection-status";
import { SeoHead } from "@/seo";

export function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isGameTable = /^\/matches\/[^/]+$/.test(location.pathname);
  const close = () => setOpen(false);
  return (
    <div className="min-h-dvh bg-app text-foreground">
      <SeoHead pathname={location.pathname} />
      <a href="#main" className="skip-link">
        Vai al contenuto
      </a>
      {!isGameTable && (
        <header className="app-header">
          <Link
            to="/"
            className="brand-link"
            onClick={close}
            aria-label="La bastarda cinese — Homepage"
          >
            <img
              className="brand-mark"
              src="/brand/logo-mark.svg"
              width="38"
              height="38"
              alt=""
              aria-hidden="true"
            />
            <span className="brand-wordmark" aria-hidden="true">
              <span className="brand-prefix">La</span> <strong>bastarda</strong>{" "}
              <span className="brand-suffix">cinese</span>
            </span>
          </Link>
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="main-navigation"
            aria-label={open ? "Chiudi menu" : "Apri menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav id="main-navigation" className={`app-nav ${open ? "is-open" : ""}`}>
            <Link to="/" onClick={close}>
              Home
            </Link>
            <Link to="/profile" onClick={close}>
              Account
            </Link>
            <Link to="/history" onClick={close}>
              Storico
            </Link>
          </nav>
          <ConnectionStatus />
        </header>
      )}
      <main id="main">
        <Outlet />
      </main>
    </div>
  );
}
