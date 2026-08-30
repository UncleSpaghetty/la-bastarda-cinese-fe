import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { ActionFeedback } from "../../components/feedback/action-feedback";
import { AceEffectModal } from "../../components/game/ace-effect-modal";
import { Card, CardBack } from "../../components/game/card";
import { TurnTimer } from "../../components/game/turn-timer";
import { apiErrorMessage } from "../../lib/api/client";
import { RealtimeClient } from "../../lib/realtime/realtime-client";
import { useConnectionStore } from "../../stores/connection-store";
import { getMatch, sendCommand } from "./api";
import type { MatchState } from "./api";

const statusLabel: Record<string, string> = {
  ACTIVE: "In gioco", FINISHED: "Ha chiuso", REENTERED: "Rientrato", RETIRED: "Ritirato", LOSER: "Ultimo classificato",
};
const specialCards: Record<string, { title: string; table: string }> = {
  "2": { title: "Due trasparente! Il tavolo dimentica tutto. Che memoria comoda.", table: "Il 2 azzera il vincolo: puoi giocare qualsiasi valore." },
  "7": { title: "Sette bastardo: adesso si vola basso.", table: "Sul 7 puoi giocare soltanto una carta pari o inferiore a 7." },
  "8": { title: "Otto! Il prossimo salta. Riposi pure, campione.", table: "L'8 salta il turno del giocatore successivo." },
  "10": { title: "Dieci: tavolo bruciato. Qualcuno qui si sente potente.", table: "Il 10 elimina tutte le carte presenti sul tavolo." },
  A: { title: "Asso servito. Scegli a chi rovinare la giornata.", table: "Chi gioca l'asso sceglie il destinatario del tavolo." },
};
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

  const mutation = useMutation({
    mutationFn: ({ name, payload }: { name: string; payload: object }) => sendCommand(id, state.data!.state_version, name, payload),
    onSuccess: (_value, variables) => {
      if (variables.name === "play_cards") {
        const ids = (variables.payload as { card_ids?: string[] }).card_ids ?? [];
        const card = state.data?.payload.players.flatMap((player) => [...(player.private_hand ?? []), ...player.public_face_up_cards]).find((item) => ids.includes(item.id));
        if (card && specialCards[card.rank]) setSpecialNotice(specialCards[card.rank].title);
      } else if (variables.name === "collect_table") setSpecialNotice("Tavolo raccolto. Un souvenir davvero ingombrante.");
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["match", id] });
    },
    onError: (error) => {
      setFeedback({ message: apiErrorMessage(error, "Questa mossa non è consentita."), tone: "error" });
      queryClient.invalidateQueries({ queryKey: ["match", id] });
    },
  });

  useEffect(() => {
    if (state.data?.payload.phase === "COMPLETED" || state.data?.payload.phase === "ABANDONED") navigate(`/matches/${id}/result`, { replace: true });
  }, [id, navigate, state.data?.payload.phase]);

  if (!state.data) return <section className="form-page"><p>Sincronizzazione del tavolo…</p></section>;
  const own = state.data.payload.players.find((player) => player.private_hand !== undefined);
  const active = state.data.payload.players.find((player) => player.seat_index === state.data.payload.turn_seat);
  const isOwnTurn = own?.seat_index === state.data.payload.turn_seat;
  const playableVisible = own?.private_hand?.length ? own.private_hand : own?.public_face_up_cards ?? [];
  const topCard = state.data.payload.table_cards.at(-1);
  const tableEffect = topCard ? specialCards[topCard.rank]?.table : undefined;
  const toggle = (cardId: string, rank: string) => {
    if (selected.includes(cardId)) return setSelected(selected.filter((item) => item !== cardId));
    const chosen = playableVisible.filter((card) => selected.includes(card.id));
    setSelected(!chosen.length || chosen[0].rank === rank ? [...selected, cardId] : [cardId]);
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
    <div className="opponents">{state.data.payload.players.filter((player) => player.id !== own?.id).map((player) => <article className={`panel opponent ${player.seat_index === state.data.payload.turn_seat ? "active-opponent" : ""}`} key={player.id}><strong>{player.display_name}</strong><p>{statusLabel[player.status] ?? player.status}{player.reentry_count ? ` · rientrato ${player.reentry_count}×` : ""} · {player.total_card_count} carte</p><div className="mini-cards">{player.public_face_up_cards.map((card) => <Card card={card} key={card.id} />)}</div></article>)}</div>
    <section className={`shared-table panel ${visualEvent?.type === "collect" ? "table-collecting" : ""}`}><div className="table-title"><h2>Tavolo</h2><div className={`deck-pile ${visualEvent?.type === "draw" ? "deck-drawing" : ""}`} aria-label={`Mazzo, ${state.data.payload.deck_count} carte`}><span /><span /><strong>{state.data.payload.deck_count}</strong></div></div><div className="card-row table-cards">{state.data.payload.table_cards.length ? state.data.payload.table_cards.map((card, index) => <Card card={card} key={card.id} animation={index === state.data.payload.table_cards.length - 1 && visualEvent?.type === "play" ? "play" : undefined} />) : <p className="muted">Il tavolo è vuoto.</p>}</div>{tableEffect && <p className="table-effect" role="status">✦ {tableEffect}</p>}</section>
    {own && <section className={`own-area ${isOwnTurn ? "own-turn" : ""}`}><div className="own-title"><h2>Le tue carte</h2>{isOwnTurn && <span>TOCCA A TE</span>}</div><div className="card-row">{playableVisible.map((card) => <Card card={card} key={card.id} selected={selected.includes(card.id)} onClick={() => isOwnTurn && toggle(card.id, card.rank)} animation={visualEvent?.type === "draw" ? "draw" : undefined} />)}{!playableVisible.length && own.own_face_down?.map((card) => <CardBack key={card.id} revealed={own.privately_seen_face_down_card?.id === card.id} onClick={() => isOwnTurn && chooseCovered(card.id)} />)}</div>{own.privately_seen_face_down_card && !playableVisible.length ? <p className="muted">Carta spiata: {own.privately_seen_face_down_card.rank} di {own.privately_seen_face_down_card.suit}. Ora selezionala e giocala.</p> : null}<div className="sticky-actions"><button className="button button-secondary" disabled={!isOwnTurn || mutation.isPending} onClick={() => mutation.mutate({ name: "collect_table", payload: {} })}>Raccogli il tavolo</button><button className="button button-primary" disabled={!isOwnTurn || !selected.length || mutation.isPending} onClick={() => mutation.mutate({ name: "play_cards", payload: { card_ids: selected } })}>Gioca {selected.length || ""}</button><button className="button button-ghost" disabled={!isOwnTurn || mutation.isPending} onClick={() => mutation.mutate({ name: "retire", payload: {} })}>Ritirati</button></div></section>}
  </section>;
}
