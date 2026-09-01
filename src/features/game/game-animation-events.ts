import type { MatchState, PlayingCard } from "./api";

export type GameAnimationKind = "play" | "draw" | "collect" | "banish";
export type GameAnimation = {
  id: string;
  kind: GameAnimationKind;
  count: number;
  from: string;
  to: string;
  actorId?: string;
  cardIds: string[];
};

type PublicEvent = NonNullable<MatchState["payload"]["recent_events"]>[number];

function newlyVisibleCardIds(previous: PlayingCard[], current: PlayingCard[]) {
  const before = new Set(previous.map((card) => card.id));
  return current.filter((card) => !before.has(card.id)).map((card) => card.id);
}

function banishesTable(previous: MatchState, event: PublicEvent) {
  const played = event.payload.cards ?? [];
  if (event.type !== "cards.played" || previous.payload.table_cards.length + played.length === 0)
    return false;
  if (played.some((card) => card.rank === "10")) return true;
  const ranks = [...played, ...previous.payload.table_cards].map((card) => card.rank);
  return ranks.length >= 4 && ranks.slice(0, 4).every((rank) => rank === ranks[0]);
}

export function normalizeGameAnimations({
  previous,
  current,
  event,
  mode = "event",
  reducedMotion = false,
}: {
  previous?: MatchState;
  current: MatchState;
  event?: PublicEvent;
  mode?: "event" | "snapshot" | "resync";
  reducedMotion?: boolean;
}): GameAnimation[] {
  if (!previous || !event || mode !== "event" || reducedMotion) return [];
  const actorId = event.payload.actor_id;
  const sequence = event.sequence;

  if (event.type === "table.collected") {
    const count = event.payload.card_count || previous.payload.table_cards.length;
    return count > 0
      ? [
          {
            id: `${sequence}-collect`,
            kind: "collect",
            count,
            from: "table",
            to: actorId ? `player:${actorId}` : "player",
            actorId,
            cardIds: [],
          },
        ]
      : [];
  }

  if (event.type !== "cards.played") return [];
  const playedCount = event.payload.cards?.length ?? 0;
  const animations: GameAnimation[] = [];
  if (banishesTable(previous, event) && current.payload.table_cards.length === 0) {
    const count = previous.payload.table_cards.length + playedCount;
    if (count > 0)
      animations.push({
        id: `${sequence}-banish`,
        kind: "banish",
        count,
        from: "table",
        to: "banished",
        actorId,
        cardIds: [],
      });
    return animations;
  }

  if (playedCount > 0)
    animations.push({
      id: `${sequence}-play`,
      kind: "play",
      count: playedCount,
      from: actorId ? `player:${actorId}` : "player",
      to: "table",
      actorId,
      cardIds: newlyVisibleCardIds(previous.payload.table_cards, current.payload.table_cards).slice(
        0,
        playedCount
      ),
    });

  const drawCount = Math.max(0, previous.payload.deck_count - current.payload.deck_count);
  if (drawCount > 0) {
    const previousActor = previous.payload.players.find((player) => player.id === actorId);
    const currentActor = current.payload.players.find((player) => player.id === actorId);
    animations.push({
      id: `${sequence}-draw`,
      kind: "draw",
      count: drawCount,
      from: "deck",
      to: actorId ? `player:${actorId}` : "player",
      actorId,
      cardIds: newlyVisibleCardIds(
        previousActor?.private_hand ?? [],
        currentActor?.private_hand ?? []
      ).slice(0, drawCount),
    });
  }
  return animations;
}
