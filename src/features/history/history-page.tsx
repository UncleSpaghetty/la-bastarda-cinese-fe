import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "../../lib/api/client";

type Event = { match_id: string; sequence: number; type: string; created_at: string; payload: Record<string, unknown> };

export function HistoryPage() {
  const history = useQuery({ queryKey: ["history"], queryFn: () => apiRequest<Event[]>("/history") });
  return <section className="form-page"><p className="eyebrow">Storico</p><h1>Le partite, azione per azione.</h1><div className="member-grid">{history.data?.map((event) => <article className="panel" key={`${event.match_id}-${event.sequence}`}><strong>{event.type}</strong><p className="muted">Partita {event.match_id.slice(0, 8)} · {new Date(event.created_at).toLocaleString("it-IT")}</p></article>)}</div>{history.data?.length === 0 && <p className="muted">Non ci sono ancora azioni registrate.</p>}</section>;
}
