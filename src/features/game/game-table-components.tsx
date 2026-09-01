import { BookOpen, ChevronLeft, History, LogOut, MoreHorizontal, PanelRightClose, Settings } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import { Card, CardBack, PeekedCardHalf } from "../../components/game/card";
import { PlayerAvatar } from "../../components/game/player-avatar";
import { TurnTimer } from "../../components/game/turn-timer";
import { ConnectionStatus } from "../../components/realtime/connection-status";

import type { MatchState, PlayerView, PlayingCard } from "./api";
import type { GameAnimation } from "./game-animation-events";
import type { SeatLayout } from "./game-layout";

const statusLabel: Record<string, string> = {
  ACTIVE: "In gioco", FINISHED: "Ha chiuso", REENTERED: "Rientrato", RETIRED: "Ritirato", LOSER: "Ultimo classificato",
};

const phaseLabel: Record<string, string> = {
  SETUP: "Preparazione", TURN: "In corso", ACE_TARGET: "Scelta dell'asso", ACE_RESPONSE: "Catena dell'asso", COMPLETED: "Conclusa", ABANDONED: "Abbandonata",
};

export function GameHeader({ matchId, phase, activeName, deadline, isOwnTurn, onBack, onHistory, historyCount, onExit }: {
  matchId: string; phase: string; activeName?: string; deadline: string | null; isOwnTurn: boolean;
  onBack: () => void; onHistory: () => void; historyCount: number; onExit: () => void;
}) {
  return <header className="game-header">
    <button className="game-icon-button" type="button" onClick={onBack} aria-label="Torna alla lobby"><ChevronLeft /></button>
    <div className="game-brand"><img src="/brand/logo-mark.svg" width="32" height="32" alt="" aria-hidden="true" /><strong>La bastarda cinese</strong></div>
    <div className="game-room-meta"><span>#{matchId.slice(0, 8)}</span><b>{phaseLabel[phase] ?? phase}</b></div>
    <div className={`game-turn-summary ${isOwnTurn ? "is-own" : ""}`}>
      <p>{isOwnTurn ? "Tocca a te" : <>Turno di <strong>{activeName ?? "—"}</strong></>}</p>
      <TurnTimer deadline={deadline} compact label="" />
    </div>
    <ConnectionStatus />
    <button className="game-icon-button game-history-button" type="button" onClick={onHistory} aria-label="Apri eventi di gioco">
      <History />{historyCount > 0 && <span>{historyCount}</span>}
    </button>
    <details className="game-menu">
      <summary className="game-icon-button" aria-label="Menu partita"><MoreHorizontal /></summary>
      <div>
        <details className="game-rules-summary"><summary><BookOpen /> Regole del gioco</summary><p>Gioca carte dello stesso valore rispettando il vincolo. Il 2 azzera, il 7 impone ≤ 7, l’8 salta, il 10 bandisce il tavolo e l’asso assegna il tavolo.</p></details>
        <button type="button" disabled><Settings /> Impostazioni bloccate</button>
        <button type="button" onClick={onExit}><LogOut /> Esci dal tavolo</button>
      </div>
    </details>
  </header>;
}

function PublicFaceUpCards({ cards }: { cards: PlayingCard[] }) {
  const visible = cards.slice(0, 3);
  return <div className="public-face-up" aria-label={`${visible.length} carte scoperte`}>
    {Array.from({ length: 3 }, (_, index) => visible[index]
      ? <span className="public-card" key={visible[index].id}><Card card={visible[index]} /></span>
      : <span className="public-card-placeholder" aria-label="Posto carta scoperta vuoto" key={`empty-face-up-${index}`}>—</span>)}
  </div>;
}

export function OpponentSeat({ player, active }: { player: PlayerView; active: boolean }) {
  return <article className={`opponent-seat ${active ? "is-active" : ""}`} data-motion-anchor={`player:${player.id}`} data-player-id={player.id}>
    <div className="opponent-seat-head">
      <PlayerAvatar name={player.display_name} seed={player.avatar_seed} url={player.avatar_url} />
      <div><strong>{player.display_name}</strong><p><span className="player-presence" />{statusLabel[player.status] ?? player.status}</p></div>
      {active && <span className="turn-indicator">Turno</span>}
    </div>
    <PublicFaceUpCards cards={player.public_face_up_cards} />
    <span className="total-card-badge">{player.total_card_count} carte</span>
  </article>;
}

export function SharedTable({ cards, deckCount, constraint, pendingEffect }: {
  cards: PlayingCard[]; deckCount: number; constraint: MatchState["payload"]["constraint"]; pendingEffect: MatchState["payload"]["pending_effect"];
}) {
  const constraintText = !constraint?.rank ? "Gioca qualsiasi carta" : constraint.lower_or_equal_seven ? `Gioca ≤ ${constraint.rank}` : `Gioca ≥ ${constraint.rank}`;
  const stack = [...cards].reverse();
  return <section className="shared-game-table" data-motion-anchor="table">
    <div className="shared-table-copy"><span>Tavolo</span><strong>{constraintText}</strong>{pendingEffect && <small>{pendingEffect.type === "ACE_TARGET" ? "Asso: scegli il destinatario" : "Effetto in risoluzione"}</small>}</div>
    <div className="table-playing-area">
      <div className="deck-pile" data-motion-anchor="deck" aria-label={`Mazzo, ${deckCount} carte`}><i /><i /><b>{deckCount}</b><small>Mazzo</small></div>
      <div className="played-stack" aria-label={`${cards.length} carte sul tavolo`}>
        {stack.length ? stack.map((card, index) => <span key={card.id} style={{
          "--stack-x": `${(index % 4) * 3}px`, "--stack-y": `${(index % 5) * 3}px`, "--stack-r": `${(index % 3) - 1}deg`, zIndex: index,
        } as React.CSSProperties}><Card card={card} /></span>) : <p>Tavolo vuoto</p>}
        <b className="table-count-badge">{cards.length} {cards.length === 1 ? "carta" : "carte"}</b>
      </div>
    </div>
    <span className="banished-target" data-motion-anchor="banished" aria-hidden="true">Bandite</span>
  </section>;
}

export function LocalPlayerDock({ player, active, selected, onToggle, onCovered, onPlay, onCollect, busy }: {
  player: PlayerView; active: boolean; selected: string[];
  onToggle: (id: string, rank: string) => void; onCovered: (id: string) => void; onPlay: () => void; onCollect: () => void; busy: boolean;
}) {
  const hand = player.private_hand ?? [];
  const faceUpIsActive = hand.length === 0 && player.public_face_up_cards.length > 0;
  const coveredIsActive = hand.length === 0 && player.public_face_up_cards.length === 0;
  return <article className={`local-player-dock ${active ? "is-active" : ""}`} data-motion-anchor={`player:${player.id}`} data-player-id={player.id}>
    <div className="local-player-head">
      <PlayerAvatar name={player.display_name} seed={player.avatar_seed} url={player.avatar_url} />
      <div><strong>{player.display_name} <span>(tu)</span></strong><p>{statusLabel[player.status] ?? player.status} · {player.total_card_count} carte</p></div>
      {active && <b>Tocca a te</b>}
    </div>
    <div className="local-public-zones">
      <div><small>Scoperte</small><div className="local-face-up">{Array.from({ length: 3 }, (_, index) => {
        const card = player.public_face_up_cards[index];
        return card ? <span key={card.id}><Card card={card} selected={selected.includes(card.id)} onClick={faceUpIsActive && active ? () => onToggle(card.id, card.rank) : undefined} /></span> : <i key={`empty-up-${index}`}>—</i>;
      })}</div></div>
      <div><small>Coperte</small><div className="local-face-down">{Array.from({ length: 3 }, (_, index) => {
        const card = player.own_face_down?.[index];
        if (!card) return <i key={`empty-down-${index}`}>—</i>;
        return player.privately_seen_face_down_card?.id === card.id
          ? <PeekedCardHalf key={card.id} card={player.privately_seen_face_down_card} selected={selected.includes(card.id)} onClick={() => active && onCovered(card.id)} />
          : <CardBack key={card.id} onClick={coveredIsActive && active ? () => onCovered(card.id) : undefined} />;
      })}</div></div>
    </div>
    {hand.length > 0 && <div className="private-hand-fan" aria-label={`La tua mano, ${hand.length} carte`} style={{ "--fan-divisor": Math.max(1, hand.length - 1) } as React.CSSProperties}>
      {hand.map((card, index) => {
        const center = (hand.length - 1) / 2;
        const angle = Math.max(-16, Math.min(16, (index - center) * 3.2));
        return <span className={selected.includes(card.id) ? "is-selected" : ""} key={card.id} style={{
          "--fan-angle": `${angle}deg`, "--fan-y": `${Math.abs(index - center) * 2.2}px`, zIndex: index,
        } as React.CSSProperties}><Card card={card} selected={selected.includes(card.id)} onClick={() => active && onToggle(card.id, card.rank)} /></span>;
      })}
    </div>}
    <div className="local-actions">
      <button className="button button-secondary" type="button" disabled={!active || busy} onClick={onCollect}>Raccogli il tavolo</button>
      <button className="button button-primary" type="button" disabled={!active || !selected.length || busy} onClick={onPlay}>Gioca{selected.length ? ` · ${selected.length}` : ""}</button>
    </div>
  </article>;
}

export function GameArena({ layout, turnSeat, table, localDock }: {
  layout: SeatLayout; turnSeat: number | null; table: React.ReactNode; localDock?: React.ReactNode;
}) {
  const render = ({ player }: SeatLayout["top"][number]) => <OpponentSeat key={player.id} player={player} active={player.seat_index === turnSeat} />;
  return <div className="game-arena">
    <div className="game-opponents-rail">
      <div className="game-seat-zone game-seat-top">{layout.top.map(render)}</div>
      <div className="game-seat-zone game-seat-left">{layout.left.map(render)}</div>
      <div className="game-seat-zone game-seat-right">{layout.right.map(render)}</div>
    </div>
    {table}
    {localDock}
  </div>;
}

function eventCopy(event: NonNullable<MatchState["payload"]["recent_events"]>[number]) {
  if (event.type === "cards.played") return <>ha giocato <b>{event.payload.cards?.map((card) => card.rank).join(", ") || "una carta"}</b></>;
  if (event.type === "table.collected") return <>ha raccolto il tavolo <b>· {event.payload.card_count ?? 0} carte</b></>;
  if (event.type === "player.retired") return <>si è ritirato</>;
  return <>ha completato una mossa</>;
}

export function GameEventLog({ events, open, onClose }: { events: MatchState["payload"]["recent_events"]; open: boolean; onClose: () => void }) {
  return <aside className={`game-event-log ${open ? "is-open" : ""}`} aria-label="Eventi di gioco" aria-hidden={!open}>
    <div className="event-log-head"><div><span>Partita</span><h2>Eventi di gioco</h2></div><button className="game-icon-button" type="button" onClick={onClose} aria-label="Chiudi eventi"><PanelRightClose /></button></div>
    {events?.length ? <ol>{events.map((event) => <li key={event.sequence}><span className={`event-dot event-${event.type.replaceAll(".", "-")}`} /><div><strong>{event.payload.actor_name ?? "Sistema"}</strong><p>{eventCopy(event)}</p><time>{new Date(event.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</time></div></li>)}</ol> : <p className="empty-events">Nessun evento da mostrare.</p>}
  </aside>;
}

export function CardMovementLayer({ animations }: { animations: GameAnimation[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    for (const animation of animations) {
      const origin = document.querySelector<HTMLElement>(`[data-motion-anchor="${animation.from}"]`);
      const target = document.querySelector<HTMLElement>(`[data-motion-anchor="${animation.to}"]`);
      if (!origin || !target) continue;
      const from = origin.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      layer.querySelectorAll<HTMLElement>(`[data-movement-id="${animation.id}"]`).forEach((particle) => {
        particle.style.setProperty("--motion-from-x", `${from.left + from.width / 2}px`);
        particle.style.setProperty("--motion-from-y", `${from.top + from.height / 2}px`);
        particle.style.setProperty("--motion-to-x", `${to.left + to.width / 2}px`);
        particle.style.setProperty("--motion-to-y", `${to.top + to.height / 2}px`);
      });
    }
  }, [animations]);
  return <div className="card-movement-layer" ref={ref} aria-hidden="true">
    {animations.flatMap((animation) => Array.from({ length: ["collect", "banish"].includes(animation.kind) ? Math.min(animation.count, 3) : animation.count }, (_, index) =>
      <i className={`movement-card movement-${animation.kind}`} data-movement-id={animation.id} key={`${animation.id}-${index}`} style={{ "--motion-delay": `${index * 70}ms` } as React.CSSProperties} />))}
  </div>;
}
