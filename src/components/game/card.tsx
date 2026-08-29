import type { PlayingCard } from "../../features/game/api";

const suitSymbol: Record<string, string> = { CLUBS: "♣", DIAMONDS: "♦", HEARTS: "♥", SPADES: "♠" };

export function Card({ card, selected = false, onClick }: { card: PlayingCard; selected?: boolean; onClick?: () => void }) {
  const red = card.suit === "HEARTS" || card.suit === "DIAMONDS";
  return <button type="button" className={`game-card ${red ? "red-card" : ""} ${selected ? "selected-card" : ""}`} onClick={onClick} aria-pressed={selected} aria-label={`${card.rank} di ${card.suit}`}>
    <span>{card.rank}</span><span className="suit">{suitSymbol[card.suit]}</span>
  </button>;
}

export function CardBack() { return <div className="game-card card-back" aria-label="Carta coperta"><span>B</span></div>; }
