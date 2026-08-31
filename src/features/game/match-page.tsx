import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { ActionFeedback } from "../../components/feedback/action-feedback";
import { AceEffectModal } from "../../components/game/ace-effect-modal";
import { Card, CardBack, PeekedCardHalf } from "../../components/game/card";
import { PlayerAvatar } from "../../components/game/player-avatar";
import { TurnTimer } from "../../components/game/turn-timer";
import { apiErrorMessage } from "../../lib/api/client";
import { RealtimeClient } from "../../lib/realtime/realtime-client";
import { useConnectionStore } from "../../stores/connection-store";
import { getMatch, sendCommand } from "./api";
import type { MatchState, PlayerView } from "./api";

const statusLabel: Record<string, string> = {
  ACTIVE: "In gioco", FINISHED: "Ha chiuso", REENTERED: "Rientrato", RETIRED: "Ritirato", LOSER: "Ultimo classificato",
};
const specialCards: Record<string, { messages: string[]; table: string }> = {
  "2": { messages: ["Due trasparente: regole azzerate, talento ancora da trovare.", "Un 2 salva tutti. Perfino chi non lo meritava.", "Reset totale. La strategia era sopravvalutata comunque."], table: "Il 2 azzera il vincolo: puoi giocare qualsiasi valore." },
  "7": { messages: ["Sette bastardo: adesso si vola basso. Come le aspettative.", "Sotto il sette, proprio dove sta il livello del tavolo.", "Il 7 ha abbassato l'asticella. Finalmente alla vostra portata."], table: "Sul 7 puoi giocare soltanto una carta pari o inferiore a 7." },
  "8": { messages: ["Otto! Il prossimo salta. Una pausa dalla sua mediocrità.", "Turno saltato. Il tavolo ringrazia.", "L'8 ti ha ignorato con la stessa eleganza del gruppo chat."], table: "L'8 salta il turno del giocatore successivo." },
  "10": { messages: ["Dieci: tavolo bruciato. Restano solo le vostre pessime scelte.", "Pulizia completa. Per la dignità è troppo tardi.", "Il 10 cancella il tavolo, non gli errori che vi hanno portato qui."], table: "Il 10 elimina tutte le carte presenti sul tavolo." },
  A: { messages: ["Asso servito. Scegli a chi rovinare la giornata.", "Un asso e improvvisamente tutti evitano il contatto visivo.", "Passa il disastro a un amico. È questo il senso dell'amicizia."], table: "Chi gioca l'asso sceglie il destinatario del tavolo." },
};
const collectMessages = ["Tavolo raccolto. Un souvenir davvero ingombrante.", "Hai preso tutto. L'avidità, almeno, non ti manca.", "Che bella mano piena. Peccato sia piena di problemi.", "Raccogliere il tavolo: la passeggiata della vergogna, ma con le carte."];
const rankOrder = ["3", "4", "5", "6", "7", "8", "9", "J", "Q", "K", "2", "10", "A"];
const sortCards = (cards: MatchState["payload"]["table_cards"]) => [...cards].sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank) || a.suit.localeCompare(b.suit));
const alwaysPlayable = new Set(["2", "10", "A"]);
const ordinaryStrength: Record<string, number> = { "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, J: 11, Q: 12, K: 13 };
function isCardLegal(card: MatchState["payload"]["table_cards"][number], payload: MatchState["payload"]) {
  if (payload.phase === "ACE_RESPONSE") return alwaysPlayable.has(card.rank);
  const constraint = payload.constraint;
  if (alwaysPlayable.has(card.rank) || !constraint?.rank) return true;
  if (!(card.rank in ordinaryStrength)) return false;
  if (constraint.lower_or_equal_seven) return ordinaryStrength[card.rank] <= 7;
  return !(constraint.rank in ordinaryStrength) || ordinaryStrength[card.rank] >= ordinaryStrength[constraint.rank];
}
type VisualEvent = { type: "play" | "draw" | "collect"; key: number };

export function MatchPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const state = useQuery({ queryKey: ["match", id], queryFn: () => getMatch(id), refetchInterval: 2_000 });
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; tone?: "success" | "error" }>();
  const [specialNotice, setSpecialNotice] = useState<string>();
  const [visualEvent, setVisualEvent] = useState<VisualEvent>();
  const previous = useRef<{ table: number; deck: number } | undefined>(undefined);
  const lastNoticeSequence = useRef<number | undefined>(undefined);
  const autoCollectedVersion = useRef<number | undefined>(undefined);
  const eventKey = useRef(0);
  const setConnection = useConnectionStore((value) => value.setStatus);

  useEffect(() => {
    const base = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws/v1";
    const socket = new RealtimeClient({
      url: `${base}/matches/${id}/`, onStatus: setConnection,
      onMessage: (message) => {
        if (message.type === "game.state") queryClient.setQueryData(["match", id], message as MatchState);
        if (message.type === "resync.required") queryClient.invalidateQueries({ queryKey: ["match", id] });
      },
    });
    socket.connect();
    return () => socket.disconnect();
  }, [id, queryClient, setConnection]);

  useEffect(() => {
    if (!feedback && !specialNotice) return;
    const timer = window.setTimeout(() => { setFeedback(undefined); setSpecialNotice(undefined); }, 4_500);
    return () => window.clearTimeout(timer);
  }, [feedback, specialNotice]);

  useEffect(() => {
    if (!state.data) return;
    const next = { table: state.data.payload.table_cards.length, deck: state.data.payload.deck_count };
    const old = previous.current;
    if (old) {
      const type = next.deck < old.deck ? "draw" : next.table > old.table ? "play" : next.table < old.table ? "collect" : undefined;
      if (type) setVisualEvent({ type, key: ++eventKey.current });
    }
    previous.current = next;
  }, [state.data]);

  useEffect(() => {
    const latest = state.data?.payload.recent_events?.[0];
    if (!latest) return;
    if (lastNoticeSequence.current === undefined) {
      lastNoticeSequence.current = latest.sequence;
      return;
    }
    if (latest.sequence <= lastNoticeSequence.current) return;
    lastNoticeSequence.current = latest.sequence;
    if (latest.payload.special_message) setSpecialNotice(latest.payload.special_message);
    else if (latest.type === "cards.played") {
      const special = latest.payload.cards?.find((card) => specialCards[card.rank]);
      if (special) setSpecialNotice(specialCards[special.rank].messages[latest.sequence % specialCards[special.rank].messages.length]);
    } else if (latest.type === "table.collected") setSpecialNotice(collectMessages[latest.sequence % collectMessages.length]);
  }, [state.data?.payload.recent_events]);

  const mutation = useMutation({
    mutationFn: ({ name, payload }: { name: string; payload: object }) => sendCommand(id, state.data!.state_version, name, payload),
    onSuccess: () => {
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["match", id] });
    },
    onError: (error) => {
      setFeedback({ message: apiErrorMessage(error, "Questa mossa non è consentita."), tone: "error" });
      queryClient.invalidateQueries({ queryKey: ["match", id] });
    },
  });

  useEffect(() => {
    const match = state.data;
    if (!match || mutation.isPending || autoCollectedVersion.current === match.state_version) return;
    const player = match.payload.players.find((item) => item.private_hand !== undefined);
    if (!player || player.seat_index !== match.payload.turn_seat || !["TURN", "ACE_RESPONSE"].includes(match.payload.phase)) return;
    const visible = player.private_hand?.length ? player.private_hand : player.public_face_up_cards;
    if (!visible.length || visible.some((card) => isCardLegal(card, match.payload))) return;
    autoCollectedVersion.current = match.state_version;
    setFeedback({ message: "Nessuna carta giocabile: il tavolo viene raccolto automaticamente." });
    mutation.mutate({ name: "collect_table", payload: {} });
  }, [mutation, state.data]);

  useEffect(() => {
    if (state.data?.payload.phase === "COMPLETED" || state.data?.payload.phase === "ABANDONED") navigate(`/matches/${id}/result`, { replace: true });
  }, [id, navigate, state.data?.payload.phase]);

  if (!state.data) return <section className="form-page"><p>Sincronizzazione del tavolo…</p></section>;
  const own = state.data.payload.players.find((player) => player.private_hand !== undefined);
  const active = state.data.payload.players.find((player) => player.seat_index === state.data.payload.turn_seat);
  const isOwnTurn = own?.seat_index === state.data.payload.turn_seat;
  const playableVisible = own?.private_hand?.length ? sortCards(own.private_hand) : own?.public_face_up_cards ?? [];
  const toggle = (cardId: string, rank: string) => {
    if (selected.includes(cardId)) return setSelected(selected.filter((item) => item !== cardId));
    const candidate = playableVisible.find((card) => card.id === cardId);
    if (candidate && !isCardLegal(candidate, state.data.payload)) {
      setFeedback({ message: state.data.payload.constraint?.lower_or_equal_seven ? "Azione non permessa: dopo un 7 puoi giocare solo valori pari o inferiori a 7." : "Azione non permessa: questa carta è inferiore al valore richiesto.", tone: "error" });
      return;
    }
    const chosen = playableVisible.filter((card) => selected.includes(card.id));
    if (chosen.length && chosen[0].rank !== rank) {
      setFeedback({ message: "Puoi giocare insieme soltanto carte dello stesso valore.", tone: "error" });
      return;
    }
    setSelected([...selected, cardId]);
  };
  const chooseCovered = (cardId: string) => {
    if (own?.privately_seen_face_down_card?.id === cardId) setSelected([cardId]);
    else mutation.mutate({ name: "peek_face_down", payload: { card_id: cardId } });
  };

  return <section className="match-page">
    <ActionFeedback message={feedback?.message} tone={feedback?.tone} />
    {specialNotice && <div className="special-toast" role="status"><span>♠</span>{specialNotice}</div>}
    {visualEvent && <div key={visualEvent.key} className={`game-motion motion-${visualEvent.type}`} aria-hidden="true"><i /><i /><i /></div>}
    <AceEffectModal phase={state.data.payload.phase} targets={state.data.payload.eligible_ace_targets} own={own} hand={playableVisible} tableCards={state.data.payload.table_cards} deadline={state.data.deadline} pending={state.data.payload.pending_effect} busy={mutation.isPending} onCommand={(name, payload) => mutation.mutate({ name, payload })} />
    <header className="match-heading">
      <div><p className="eyebrow">Partita in corso</p><h1>Tavolo</h1>{own && <p className="player-identity">Stai giocando come <strong>{own.display_name}</strong></p>}</div>
      <div className="turn-panel"><p className={isOwnTurn ? "your-turn" : ""}>{isOwnTurn ? "È il tuo turno" : <>Turno di <strong>{active?.display_name ?? "—"}</strong></>}</p><TurnTimer deadline={state.data.deadline} /></div>
    </header>
    {!own && <p className="panel ace-response" role="status">Modalità spettatore · osservazione in sola lettura</p>}
    <div className="game-board"><div className="table-arena"><div className="table-filigree" aria-hidden="true"><span>♥</span><span>♣</span><span>♠</span></div><div className="opponent-ring">{state.data.payload.players.filter((player) => player.id !== own?.id).sort((a, b) => own ? (a.seat_index - own.seat_index + state.data.payload.players.length) % state.data.payload.players.length - (b.seat_index - own.seat_index + state.data.payload.players.length) % state.data.payload.players.length : a.seat_index - b.seat_index).map((player, index, players) => { const angle = players.length === 1 ? 270 : 165 + index * (210 / (players.length - 1)); const radians = angle * Math.PI / 180; return <PlayerSeat player={player} active={player.seat_index === state.data.payload.turn_seat} style={{ left: `${50 + Math.cos(radians) * 42}%`, top: `${51 + Math.sin(radians) * 39}%` }} key={player.id} />; })}</div>
      <section className={`shared-table panel arena-center ${visualEvent?.type === "collect" ? "table-collecting" : ""}`}><div className="table-title"><h2>Tavolo</h2><div className={`deck-pile ${visualEvent?.type === "draw" ? "deck-drawing" : ""}`} aria-label={`Mazzo, ${state.data.payload.deck_count} carte`}><span /><span /><strong>{state.data.payload.deck_count}</strong></div></div><div className="table-card-stack">{state.data.payload.table_cards.length ? state.data.payload.table_cards.slice().reverse().map((card, index, cards) => <span key={card.id} style={{ "--stack-x": `${(index % 5) * 5}px`, "--stack-y": `${(index % 4) * 4}px`, "--stack-r": `${(index % 3) - 1}deg`, zIndex: index } as React.CSSProperties}><Card card={card} animation={index === cards.length - 1 && visualEvent?.type === "play" ? "play" : undefined} /></span>) : <p className="muted">Il tavolo è vuoto.</p>}</div></section>
      {own && <article className={`panel current-seat ${isOwnTurn ? "own-turn" : ""}`}><div className="current-seat-head"><PlayerAvatar name={own.display_name} seed={own.avatar_seed} url={own.avatar_url} /><div><strong>{own.display_name} (tu)</strong><p>{statusLabel[own.status] ?? own.status} · {own.total_card_count} carte</p></div>{isOwnTurn && <span>TOCCA A TE</span>}</div><PublicZones player={own} />{own.private_hand?.length ? <div className="hand-fan">{sortCards(own.private_hand).map((card, index, cards) => <span key={card.id} style={{ "--fan-angle": `${(index - (cards.length - 1) / 2) * 4}deg`, "--fan-y": `${Math.abs(index - (cards.length - 1) / 2) * 3}px` } as React.CSSProperties}><Card card={card} selected={selected.includes(card.id)} onClick={() => isOwnTurn && toggle(card.id, card.rank)} animation={visualEvent?.type === "draw" ? "draw" : undefined} /></span>)}</div> : own.public_face_up_cards.length ? <div className="card-row current-playable">{own.public_face_up_cards.map((card) => <Card card={card} key={card.id} selected={selected.includes(card.id)} onClick={() => isOwnTurn && toggle(card.id, card.rank)} />)}</div> : <div className="covered-hand">{own.own_face_down?.map((card) => own.privately_seen_face_down_card?.id === card.id ? <PeekedCardHalf key={card.id} card={own.privately_seen_face_down_card} selected={selected.includes(card.id)} onClick={() => isOwnTurn && setSelected([card.id])} /> : <CardBack key={card.id} onClick={() => isOwnTurn && chooseCovered(card.id)} />)}</div>}<div className="table-actions"><button className="button button-primary" disabled={!isOwnTurn || !selected.length || mutation.isPending} onClick={() => mutation.mutate({ name: "play_cards", payload: { card_ids: selected } })}>Gioca {selected.length || ""}</button></div></article>}</div>
      <aside className="panel event-history"><p className="eyebrow">Cronaca del disastro</p><h2>Ultime azioni</h2>{state.data.payload.recent_events?.length ? <ol>{state.data.payload.recent_events.map((event) => <li key={event.sequence}><span className={`event-dot event-${event.type.replaceAll(".", "-")}`} /><div><strong>{event.payload.actor_name ?? "Qualcuno"}</strong><p>{event.type === "cards.played" ? <>ha giocato <b>{event.payload.cards?.map((card) => card.rank).join(", ")}</b></> : event.type === "table.collected" ? <>ha raccolto il tavolo ({event.payload.card_count ?? 0} carte)</> : event.type === "player.retired" ? "si è ritirato" : "ha eseguito una mossa"}</p></div></li>)}</ol> : <p className="muted">Ancora nessun danno da documentare.</p>}</aside></div>
  </section>;
}

function PublicZones({ player }: { player: PlayerView }) {
  const handCount = player.hand_count ?? player.private_hand?.length ?? 0;
  const downCount = player.face_down_count ?? player.own_face_down?.length ?? Math.min(3, Math.max(0, player.total_card_count - player.public_face_up_cards.length - handCount));
  return <div className="player-table-zones"><div><small>Scoperte</small><div className="mini-cards face-up-stack">{player.public_face_up_cards.map((card) => <Card card={card} key={card.id} />)}{!player.public_face_up_cards.length && <i>—</i>}</div></div><div><small>Coperte · {downCount}</small><div className="mini-cards face-down-stack">{Array.from({ length: downCount }, (_, index) => <CardBack key={index} />)}</div></div>{handCount > 0 && <span className="hidden-hand-count">Mano · {handCount}</span>}</div>;
}

function PlayerSeat({ player, active, style }: { player: PlayerView; active: boolean; style: React.CSSProperties }) {
  return <article className={`panel opponent ring-player ${active ? "active-opponent" : ""}`} style={style}><div className="opponent-head"><PlayerAvatar name={player.display_name} seed={player.avatar_seed} url={player.avatar_url} /><div><strong>{player.display_name}</strong><p>{statusLabel[player.status] ?? player.status} · {player.total_card_count} carte</p></div></div><PublicZones player={player} /></article>;
}
