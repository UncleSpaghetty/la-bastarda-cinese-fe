import type { PlayingCard } from "../../features/game/api";

const suitSymbol: Record<string, string> = { CLUBS: "♣", DIAMONDS: "♦", HEARTS: "♥", SPADES: "♠" };
const specialHelp: Record<string, string> = {
  "2": "Azzera il vincolo: dopo il 2 si può giocare qualsiasi valore.",
  "7": "Impone di giocare una carta pari o inferiore a 7.",
  "8": "Salta il turno del giocatore successivo.",
  "10": "Brucia tutte le carte presenti sul tavolo.",
  A: "Permette di scegliere chi riceverà il tavolo.",
};

export function Card({ card, selected = false, onClick, animation }: { card: PlayingCard; selected?: boolean; onClick?: () => void; animation?: "play" | "draw" | "collect" | "swap" }) {
  const red = card.suit === "HEARTS" || card.suit === "DIAMONDS";
  return <span className="card-with-tooltip"><button type="button" className={`game-card ${red ? "red-card" : ""} ${selected ? "selected-card" : ""} ${animation ? `card-${animation}` : ""}`} onClick={onClick} aria-pressed={selected} aria-label={`${card.rank} di ${card.suit}`}>
    <span>{card.rank}</span><span className="suit">{suitSymbol[card.suit]}</span>
  </button>{specialHelp[card.rank] && <span className="card-tooltip" role="tooltip">{specialHelp[card.rank]}</span>}</span>;
}

export function CardBack({ onClick, revealed = false }: { onClick?: () => void; revealed?: boolean }) {
  return <button type="button" className={`game-card card-back ${revealed ? "selected-card" : ""}`} aria-label={revealed ? "Carta coperta spiata, seleziona per giocarla" : "Spia carta coperta"} onClick={onClick}><span>{revealed ? "?" : "B"}</span></button>;
}

export function PeekedCardHalf({ card, selected, onClick }: { card: PlayingCard; selected?: boolean; onClick: () => void }) {
  const red = card.suit === "HEARTS" || card.suit === "DIAMONDS";
  return <button type="button" className={`game-card card-back peeked-card ${red ? "red-card" : ""} ${selected ? "selected-card" : ""}`} onClick={onClick} aria-pressed={selected} aria-label={`Carta coperta spiata: ${card.rank} di ${card.suit}. Tocca per selezionarla`}>
    <span className="peek-corner"><strong>{card.rank}</strong><i>{suitSymbol[card.suit]}</i></span><span className="peek-shimmer" />
  </button>;
}
