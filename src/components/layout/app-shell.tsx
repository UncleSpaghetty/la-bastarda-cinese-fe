import { Link, Outlet } from "react-router";

import { ConnectionStatus } from "@/components/realtime/connection-status";

export function AppShell() {
  return <div className="min-h-dvh bg-app text-foreground">
    <a href="#main" className="skip-link">Vai al contenuto</a>
    <header className="app-header">
      <div className="brand-mark" aria-hidden="true">B</div>
      <span className="brand-name">La bastarda cinese</span>
      <nav className="app-nav"><Link to="/">Home</Link><Link to="/profile">Account</Link><Link to="/history">Storico</Link></nav>
      <ConnectionStatus />
    </header>
    <main id="main"><Outlet /></main>
  </div>;
}
