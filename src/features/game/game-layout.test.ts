import { describe, expect, it } from "vitest";

import type { PlayerView } from "./api";
import { assignPlayerSeats } from "./game-layout";

const makePlayers = (count: number): PlayerView[] => Array.from({ length: count }, (_, seat_index) => ({
  id: `player-${seat_index}`,
  display_name: `Player ${seat_index}`,
  seat_index,
  status: "ACTIVE",
  reentry_count: 0,
  public_face_up_cards: [],
  total_card_count: 9,
}));

describe("assignPlayerSeats", () => {
  it.each([
    [4, [1, 1, 1]],
    [5, [2, 1, 1]],
    [6, [3, 1, 1]],
    [7, [4, 1, 1]],
    [8, [3, 2, 2]],
    [9, [4, 2, 2]],
    [10, [5, 2, 2]],
  ])("distributes %i players into centered top and symmetric sides", (count, expected) => {
    const players = makePlayers(count);
    const layout = assignPlayerSeats({ players, localPlayerId: "player-0" });
    expect([layout.top.length, layout.left.length, layout.right.length]).toEqual(expected);
    expect([...layout.top, ...layout.left, ...layout.right]).toHaveLength(count - 1);
  });

  it("keeps the local player in the bottom zone regardless of seat index", () => {
    const layout = assignPlayerSeats({ players: makePlayers(10), localPlayerId: "player-6" });
    expect(layout.bottom?.player.id).toBe("player-6");
    expect([...layout.top, ...layout.left, ...layout.right].some(({ player }) => player.id === "player-6")).toBe(false);
  });

  it("keeps circular opponent order stable relative to the local player", () => {
    const layout = assignPlayerSeats({ players: makePlayers(6), localPlayerId: "player-3" });
    const ids = [...layout.left, ...layout.top, ...layout.right].map(({ player }) => player.id);
    expect(ids).toEqual(["player-4", "player-5", "player-0", "player-1", "player-2"]);
  });
});
