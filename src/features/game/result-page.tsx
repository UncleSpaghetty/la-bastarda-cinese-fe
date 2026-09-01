import { useQuery } from "@tanstack/react-query";
import { ArrowRight, History as HistoryIcon } from "lucide-react";
import { Link, useParams } from "react-router";

import { PlayerAvatar } from "@/components/game/player-avatar";

import { getMatch } from "./api";
import { PLAYER_STATUS_EMOJI, PLAYER_STATUS_LABELS } from "./status-labels";

const outcomeOrder = ["FINISHED", "REENTERED", "ACTIVE", "RETIRED", "LOSER"];

export function ResultPage() {
  const { id = "" } = useParams();
  const match = useQuery({ queryKey: ["match", id], queryFn: () => getMatch(id) });
  const abandoned = match.data?.payload.phase === "ABANDONED";
  const players = [...(match.data?.payload.players ?? [])].sort(
    (a, b) => outcomeOrder.indexOf(a.status) - outcomeOrder.indexOf(b.status)
  );
  const loser = players.find((player) => player.status === "LOSER");

  return (
    <section className="result-page page-container">
      <div className="result-mark" aria-hidden="true">
        <img src="/brand/logo-mark.svg" alt="" width="72" height="72" />
      </div>
      <p className="eyebrow">RISULTATO</p>
      <h1>{abandoned ? "Partita abbandonata." : "Fine della partita."}</h1>
      <p className="result-lead">
        {abandoned ? (
          "Il tavolo si è svuotato prima del tempo. Nessun bastardo è stato incoronato."
        ) : loser ? (
          <>
            Il tavolo ha un colpevole: <strong>{loser.display_name}</strong> resta con le carte in
            mano.
          </>
        ) : (
          "Il tavolo è stato ripulito. Onore a chi ha resistito fino alla fine."
        )}
      </p>
      <div className="result-grid">
        {players.map((player) => (
          <article
            className={`result-card ${player.status === "LOSER" ? "is-loser" : ""}`}
            key={player.id}
          >
            <PlayerAvatar
              name={player.display_name}
              seed={player.avatar_seed}
              url={player.avatar_url}
              size="large"
            />
            <div>
              <strong>{player.display_name}</strong>
              <span className="result-status">
                <i aria-hidden="true">{PLAYER_STATUS_EMOJI[player.status] ?? "🃏"}</i>
                {PLAYER_STATUS_LABELS[player.status] ?? player.status}
              </span>
              {player.reentry_count > 0 && (
                <small>Rientrato {player.reentry_count}× con un asso</small>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="result-actions">
        <Link className="button button-primary" to="/">
          Torna al tavolo <ArrowRight size={18} />
        </Link>
        <Link className="button button-secondary" to="/history">
          <HistoryIcon size={18} /> Vedi lo storico
        </Link>
      </div>
    </section>
  );
}
