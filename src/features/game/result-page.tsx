import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { getMatch } from "./api";

export function ResultPage() {
  const { id = "" } = useParams();
  const match = useQuery({ queryKey: ["match", id], queryFn: () => getMatch(id) });
  return (
    <section className="form-page">
      <p className="eyebrow">Risultato</p>
      <h1>
        {match.data?.payload.phase === "ABANDONED" ? "Partita abbandonata." : "Fine della partita."}
      </h1>
      <div className="member-grid">
        {match.data?.payload.players.map((player) => (
          <article className="panel member" key={player.id}>
            <strong>{player.display_name}</strong>
            <span className="ready">{player.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
