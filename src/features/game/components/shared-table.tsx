import { Card } from "@/components/game/card";

import type { MatchState, PlayingCard } from "../api";
import type { SeatLayout } from "../game-layout";
import { OpponentSeat } from "./opponent-seat";

export function SharedTable({
  cards,
  deckCount,
  constraint,
  pendingEffect,
}: {
  cards: PlayingCard[];
  deckCount: number;
  constraint: MatchState["payload"]["constraint"];
  pendingEffect: MatchState["payload"]["pending_effect"];
}) {
  const constraintText = !constraint?.rank
    ? "Gioca qualsiasi carta"
    : constraint.lower_or_equal_seven
      ? `Gioca ≤ ${constraint.rank}`
      : `Gioca ≥ ${constraint.rank}`;
  const stack = [...cards].reverse();
  return (
    <section className="shared-game-table" data-motion-anchor="table">
      <div className="shared-table-copy">
        <span>Tavolo</span>
        <strong>{constraintText}</strong>
        {pendingEffect && (
          <small>
            {pendingEffect.type === "ACE_TARGET"
              ? "Asso: scegli il destinatario"
              : "Effetto in risoluzione"}
          </small>
        )}
      </div>
      <div className="table-playing-area">
        <div
          className="deck-pile"
          data-motion-anchor="deck"
          aria-label={`Mazzo, ${deckCount} carte`}
        >
          <i />
          <i />
          <b>{deckCount}</b>
          <small>Mazzo</small>
        </div>
        <div className="played-stack" aria-label={`${cards.length} carte sul tavolo`}>
          {stack.length ? (
            stack.map((card, index) => (
              <span
                key={card.id}
                style={
                  {
                    "--stack-x": `${(index % 4) * 3}px`,
                    "--stack-y": `${(index % 5) * 3}px`,
                    "--stack-r": `${(index % 3) - 1}deg`,
                    zIndex: index,
                  } as React.CSSProperties
                }
              >
                <Card card={card} />
              </span>
            ))
          ) : (
            <p>Tavolo vuoto</p>
          )}
          <b className="table-count-badge">
            {cards.length} {cards.length === 1 ? "carta" : "carte"}
          </b>
        </div>
      </div>
      <span className="banished-target" data-motion-anchor="banished" aria-hidden="true">
        Bandite
      </span>
    </section>
  );
}

export function GameArena({
  layout,
  turnSeat,
  table,
  localDock,
}: {
  layout: SeatLayout;
  turnSeat: number | null;
  table: React.ReactNode;
  localDock?: React.ReactNode;
}) {
  const render = ({ player }: SeatLayout["top"][number]) => (
    <OpponentSeat key={player.id} player={player} active={player.seat_index === turnSeat} />
  );
  return (
    <div className="game-arena">
      <div className="game-opponents-rail">
        <div className="game-seat-zone game-seat-top">{layout.top.map(render)}</div>
        <div className="game-seat-zone game-seat-left">{layout.left.map(render)}</div>
        <div className="game-seat-zone game-seat-right">{layout.right.map(render)}</div>
      </div>
      {table}
      {localDock}
    </div>
  );
}
