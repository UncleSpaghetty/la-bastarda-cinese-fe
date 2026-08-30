import type { PlayingCard } from "../../features/game/api";

const suitSymbol: Record<string, string> = { CLUBS: "♣", DIAMONDS: "♦", HEARTS: "♥", SPADES: "♠" };

export function Card({ card, selected = false, onClick, animation }: { card: PlayingCard; selected?: boolean; onClick?: () => void; animation?: "play" | "draw" | "collect" | "swap" }) {
  const red = card.suit === "HEARTS" || card.suit === "DIAMONDS";
  return <button type="button" className={`game-card ${red ? "red-card" : ""} ${selected ? "selected-card" : ""} ${animation ? `card-${animation}` : ""}`} onClick={onClick} aria-pressed={selected} aria-label={`${card.rank} di ${card.suit}`}>
    <span>{card.rank}</span><span className="suit">{suitSymbol[card.suit]}</span>
  </button>;
}

export function CardBack({ onClick, revealed = false }: { onClick?: () => void; revealed?: boolean }) {
  return <button type="button" className={`game-card card-back ${revealed ? "selected-card" : ""}`} aria-label={revealed ? "Carta coperta spiata, seleziona per giocarla" : "Spia carta coperta"} onClick={onClick}><span>{revealed ? "?" : "B"}</span></button>;
}
