import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PlayerView } from "./api";
import { OpponentSeat } from "./game-table-components";

const cards = ["3", "7", "K"].map((rank, index) => ({ id: `face-${index}`, rank, suit: index === 1 ? "HEARTS" : "CLUBS" }));
const player: PlayerView = {
  id: "opponent", display_name: "Giulia", seat_index: 2, status: "ACTIVE", reentry_count: 0,
  public_face_up_cards: cards, total_card_count: 9,
  hand_count: 4, face_down_count: 2, private_hand: [{ id: "private", rank: "A", suit: "SPADES" }],
  own_face_down: [{ id: "covered", rank: "10", suit: "HEARTS" }],
};

describe("OpponentSeat", () => {
  it("renders only three public face-up cards and the aggregate total", () => {
    const { container } = render(<OpponentSeat player={player} active={false} />);
    expect(screen.getByText("9 carte")).toBeInTheDocument();
    expect(container.querySelectorAll(".public-card")).toHaveLength(3);
    expect(screen.queryByText(/Mano|Coperte/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("A di SPADES")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("10 di HEARTS")).not.toBeInTheDocument();
  });

  it("preserves card nodes across public updates because IDs are stable", () => {
    const { rerender } = render(<OpponentSeat player={player} active={false} />);
    const first = screen.getByLabelText("3 di CLUBS");
    rerender(<OpponentSeat player={{ ...player, total_card_count: 8 }} active />);
    expect(screen.getByLabelText("3 di CLUBS")).toBe(first);
  });
});
