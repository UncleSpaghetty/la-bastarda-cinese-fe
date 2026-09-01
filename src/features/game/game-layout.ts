import type { PlayerView } from "./api";

export type SeatZone = "top" | "left" | "right" | "bottom";
export type SeatAssignment = { player: PlayerView; zone: SeatZone; index: number };
export type SeatLayout = {
  top: SeatAssignment[];
  left: SeatAssignment[];
  right: SeatAssignment[];
  bottom?: SeatAssignment;
};

export type SeatLayoutInput = {
  players: PlayerView[];
  localPlayerId: string;
};

function circularOrder(players: PlayerView[], local?: PlayerView) {
  const sorted = [...players].sort((a, b) => a.seat_index - b.seat_index);
  if (!local) return sorted;
  const total = sorted.length;
  return sorted
    .filter((player) => player.id !== local.id)
    .sort((a, b) =>
      ((a.seat_index - local.seat_index + total) % total)
      - ((b.seat_index - local.seat_index + total) % total));
}

/**
 * Assigns seats without consulting viewport or DOM state. The side capacity grows
 * first, leaving the remaining seats in a centered top row (maximum five when a
 * local player occupies the bottom dock).
 */
export function assignPlayerSeats({ players, localPlayerId }: SeatLayoutInput): SeatLayout {
  const local = players.find((player) => player.id === localPlayerId);
  const opponents = circularOrder(players, local);
  const opponentCount = opponents.length;
  const sideSize = opponentCount >= 7 ? 2 : opponentCount >= 3 ? 1 : 0;
  const topSize = opponentCount - sideSize * 2;
  const leftPlayers = opponents.slice(0, sideSize);
  const topPlayers = opponents.slice(sideSize, sideSize + topSize);
  const rightPlayers = opponents.slice(sideSize + topSize);

  return {
    left: leftPlayers.map((player, index) => ({ player, zone: "left", index })),
    top: topPlayers.map((player, index) => ({ player, zone: "top", index })),
    right: rightPlayers.map((player, index) => ({ player, zone: "right", index })),
    bottom: local ? { player: local, zone: "bottom", index: 0 } : undefined,
  };
}
