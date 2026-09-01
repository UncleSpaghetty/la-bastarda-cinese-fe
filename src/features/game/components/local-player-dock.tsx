import { Card, CardBack, PeekedCardHalf } from "@/components/game/card";
import { PlayerAvatar } from "@/components/game/player-avatar";

import type { PlayerView } from "../api";
import { PLAYER_STATUS_LABELS } from "../status-labels";

export function LocalPlayerDock({
  player,
  active,
  selected,
  onToggle,
  onCovered,
  onPlay,
  onCollect,
  busy,
}: {
  player: PlayerView;
  active: boolean;
  selected: string[];
  onToggle: (id: string, rank: string) => void;
  onCovered: (id: string) => void;
  onPlay: () => void;
  onCollect: () => void;
  busy: boolean;
}) {
  const hand = player.private_hand ?? [];
  const faceUpIsActive = hand.length === 0 && player.public_face_up_cards.length > 0;
  const coveredIsActive = hand.length === 0 && player.public_face_up_cards.length === 0;
  return (
    <article
      className={`local-player-dock ${active ? "is-active" : ""} ${hand.length === 0 ? "no-hand" : ""}`}
      data-motion-anchor={`player:${player.id}`}
      data-player-id={player.id}
    >
      <div className="local-player-head">
        <PlayerAvatar
          name={player.display_name}
          seed={player.avatar_seed}
          url={player.avatar_url}
        />
        <div>
          <strong>
            {player.display_name} <span>(tu)</span>
          </strong>
          <p>
            {PLAYER_STATUS_LABELS[player.status] ?? player.status} · {player.total_card_count} carte
          </p>
        </div>
        {active && <b>Tocca a te</b>}
      </div>
      <div className="local-public-zones">
        <div>
          <small>Scoperte</small>
          <div className="local-face-up">
            {Array.from({ length: 3 }, (_, index) => {
              const card = player.public_face_up_cards[index];
              return card ? (
                <span key={card.id}>
                  <Card
                    card={card}
                    selected={selected.includes(card.id)}
                    onClick={
                      faceUpIsActive && active ? () => onToggle(card.id, card.rank) : undefined
                    }
                  />
                </span>
              ) : (
                <i key={`empty-up-${index}`}>—</i>
              );
            })}
          </div>
        </div>
        <div>
          <small>Coperte</small>
          <div className="local-face-down">
            {Array.from({ length: 3 }, (_, index) => {
              const card = player.own_face_down?.[index];
              if (!card) return <i key={`empty-down-${index}`}>—</i>;
              return player.privately_seen_face_down_card?.id === card.id ? (
                <PeekedCardHalf
                  key={card.id}
                  card={player.privately_seen_face_down_card}
                  selected={selected.includes(card.id)}
                  onClick={() => active && onCovered(card.id)}
                />
              ) : (
                <CardBack
                  key={card.id}
                  onClick={coveredIsActive && active ? () => onCovered(card.id) : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>
      {hand.length > 0 && (
        <div
          className="private-hand-fan"
          aria-label={`La tua mano, ${hand.length} carte`}
          style={{ "--fan-divisor": Math.max(1, hand.length - 1) } as React.CSSProperties}
        >
          {hand.map((card, index) => {
            const center = (hand.length - 1) / 2;
            const angle = Math.max(-16, Math.min(16, (index - center) * 3.2));
            return (
              <span
                className={selected.includes(card.id) ? "is-selected" : ""}
                key={card.id}
                style={
                  {
                    "--fan-angle": `${angle}deg`,
                    "--fan-y": `${Math.abs(index - center) * 2.2}px`,
                    zIndex: index,
                  } as React.CSSProperties
                }
              >
                <Card
                  card={card}
                  selected={selected.includes(card.id)}
                  onClick={() => active && onToggle(card.id, card.rank)}
                />
              </span>
            );
          })}
        </div>
      )}
      <div className="local-actions">
        <button
          className="button button-secondary"
          type="button"
          disabled={!active || busy}
          onClick={onCollect}
        >
          Raccogli il tavolo
        </button>
        <button
          className="button button-primary"
          type="button"
          disabled={!active || !selected.length || busy}
          onClick={onPlay}
        >
          Gioca{selected.length ? ` · ${selected.length}` : ""}
        </button>
      </div>
    </article>
  );
}
