import { WifiOff } from "lucide-react";

import { useConnectionStore } from "@/stores/connection-store";

const labels = { idle: "Non connesso", connecting: "Connessione…", open: "Connesso", reconnecting: "Riconnessione…" } as const;

export function ConnectionStatus() {
  const status = useConnectionStore((state) => state.status);
  return <div className="connection-status" role="status" aria-live="polite">
    {status !== "open" && <WifiOff size={16} aria-hidden="true" />}{labels[status]}
  </div>;
}
