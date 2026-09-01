import { Card } from "@/components/game/card";
import { PlayerAvatar } from "@/components/game/player-avatar";

import type { PlayerView, PlayingCard } from "../api";
import { PLAYER_STATUS_LABELS } from "../status-labels";

function PublicFaceUpCards({ cards }: { cards: PlayingCard[] }) {
  const visible = cards.slice(0, 3);
  return (
    <div className="public-face-up" aria-label={`${visible.length} carte scoperte`}>
      {Array.from({ length: 3 }, (_, index) =>
        visible[index] ? (
          <span className="public-card" key={visible[index].id}>
            <Card card={visible[index]} />
          </span>
        ) : (
          <span
            className="public-card-placeholder"
            aria-label="Posto carta scoperta vuoto"
            key={`empty-face-up-${index}`}
          >
            —
          </span>
        )
      )}
    </div>
  );
}

export function OpponentSeat({ player, active }: { player: PlayerView; active: boolean }) {
  return (
    <article
      className={`opponent-seat ${active ? "is-active" : ""}`}
      data-motion-anchor={`player:${player.id}`}
      data-player-id={player.id}
    >
      <div className="opponent-seat-head">
        <PlayerAvatar
          name={player.display_name}
          seed={player.avatar_seed}
          url={player.avatar_url}
        />
        <div>
          <strong>{player.display_name}</strong>
          <p>
            <span className="player-presence" />
            {PLAYER_STATUS_LABELS[player.status] ?? player.status}
          </p>
        </div>
        {active && <span className="turn-indicator">Turno</span>}
      </div>
      <PublicFaceUpCards cards={player.public_face_up_cards} />
      <span className="total-card-badge">{player.total_card_count} carte</span>
    </article>
  );
}
