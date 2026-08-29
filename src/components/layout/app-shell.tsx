import { Outlet } from "react-router";

import { ConnectionStatus } from "@/components/realtime/connection-status";

export function AppShell() {
  return <div className="min-h-dvh bg-app text-foreground">
    <a href="#main" className="skip-link">Vai al contenuto</a>
    <header className="app-header">
      <div className="brand-mark" aria-hidden="true">B</div>
      <span className="brand-name">La bastarda cinese</span>
      <ConnectionStatus />
    </header>
    <main id="main"><Outlet /></main>
  </div>;
}
