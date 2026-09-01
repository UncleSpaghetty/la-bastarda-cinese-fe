import { describe, expect, it } from "vitest";

import type { MatchState } from "./api";
import { normalizeGameAnimations } from "./game-animation-events";

const card = (id: string, rank = "5") => ({ id, rank, suit: "CLUBS" });
const state = ({ deck = 20, table = [], hand = [card("h1"), card("h2"), card("h3")], sequence = 1, eventType = "cards.played", eventCards = [card("event")] }: {
  deck?: number; table?: ReturnType<typeof card>[]; hand?: ReturnType<typeof card>[]; sequence?: number; eventType?: string; eventCards?: ReturnType<typeof card>[];
} = {}): MatchState => ({
  match_id: "match", state_version: sequence, deadline: null,
  payload: {
    phase: "TURN", deck_count: deck, table_cards: table, turn_seat: 0,
    players: [{ id: "me", display_name: "Me", seat_index: 0, status: "ACTIVE", reentry_count: 0, public_face_up_cards: [], total_card_count: hand.length, private_hand: hand }],
    recent_events: [{ sequence, type: eventType, created_at: "", payload: { actor_id: "me", actor_name: "Me", cards: eventCards, card_count: table.length } }],
  },
});

describe("normalizeGameAnimations", () => {
  it.each([[0, 0], [1, 1], [3, 3]])("maps a draw of %i cards to %i visual cards", (draw, expected) => {
    const previous = state({ deck: 20, sequence: 1 });
    const current = state({ deck: 20 - draw, sequence: 2, table: [card("played")], hand: [card("h1"), card("h2"), card("h3"), ...Array.from({ length: draw }, (_, index) => card(`new-${index}`))] });
    const result = normalizeGameAnimations({ previous, current, event: current.payload.recent_events?.[0] });
    expect(result.find(({ kind }) => kind === "draw")?.count ?? 0).toBe(expected);
  });

  it("animates exactly the number of cards in a multiple play", () => {
    const previous = state();
    const eventCards = [card("a", "7"), card("b", "7"), card("c", "7")];
    const current = state({ table: eventCards, sequence: 2, eventCards });
    expect(normalizeGameAnimations({ previous, current, event: current.payload.recent_events?.[0] }).find(({ kind }) => kind === "play")?.count).toBe(3);
  });

  it("moves a collection from the table to its recipient", () => {
    const previous = state({ table: [card("t1"), card("t2")] });
    const current = state({ table: [], sequence: 2, eventType: "table.collected", eventCards: [] });
    const result = normalizeGameAnimations({ previous, current, event: current.payload.recent_events?.[0] });
    expect(result).toMatchObject([{ kind: "collect", count: 2, from: "table", to: "player:me" }]);
  });

  it("banishes only the table for a ten and creates no player movement", () => {
    const previous = state({ table: [card("t1", "K"), card("t2", "K")] });
    const current = state({ table: [], sequence: 2, eventCards: [card("ten", "10")] });
    const result = normalizeGameAnimations({ previous, current, event: current.payload.recent_events?.[0] });
    expect(result).toMatchObject([{ kind: "banish", count: 3, from: "table", to: "banished" }]);
    expect(result.some(({ from, to }) => from.startsWith("player") || to.startsWith("player"))).toBe(false);
  });

  it.each(["snapshot", "resync"] as const)("does not replay movements for a %s", (mode) => {
    const previous = state();
    const current = state({ deck: 17, table: [card("new")], sequence: 2 });
    expect(normalizeGameAnimations({ previous, current, event: current.payload.recent_events?.[0], mode })).toEqual([]);
  });

  it("does not animate when reduced motion is requested", () => {
    const previous = state();
    const current = state({ table: [card("new")], sequence: 2 });
    expect(normalizeGameAnimations({ previous, current, event: current.payload.recent_events?.[0], reducedMotion: true })).toEqual([]);
  });
});
