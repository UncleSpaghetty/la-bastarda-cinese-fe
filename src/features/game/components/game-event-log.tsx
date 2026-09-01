import { PanelRightClose } from "lucide-react";

import type { MatchState } from "../api";

function eventCopy(event: NonNullable<MatchState["payload"]["recent_events"]>[number]) {
  if (event.type === "cards.played")
    return (
      <>
        ha giocato <b>{event.payload.cards?.map((card) => card.rank).join(", ") || "una carta"}</b>
      </>
    );
  if (event.type === "table.collected")
    return (
      <>
        ha raccolto il tavolo <b>· {event.payload.card_count ?? 0} carte</b>
      </>
    );
  if (event.type === "player.retired") return <>si è ritirato</>;
  return <>ha completato una mossa</>;
}

export function GameEventLog({
  events,
  open,
  onClose,
}: {
  events: MatchState["payload"]["recent_events"];
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      className={`game-event-log ${open ? "is-open" : ""}`}
      aria-label="Eventi di gioco"
      aria-hidden={!open}
    >
      <div className="event-log-head">
        <div>
          <span>Partita</span>
          <h2>Eventi di gioco</h2>
        </div>
        <button
          className="game-icon-button"
          type="button"
          onClick={onClose}
          aria-label="Chiudi eventi"
        >
          <PanelRightClose />
        </button>
      </div>
      {events?.length ? (
        <ol>
          {events.map((event) => (
            <li key={event.sequence}>
              <span className={`event-dot event-${event.type.replaceAll(".", "-")}`} />
              <div>
                <strong>{event.payload.actor_name ?? "Sistema"}</strong>
                <p>{eventCopy(event)}</p>
                <time>
                  {new Date(event.created_at).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-events">Nessun evento da mostrare.</p>
      )}
    </aside>
  );
}
