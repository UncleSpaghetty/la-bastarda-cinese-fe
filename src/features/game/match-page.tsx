import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Card, CardBack } from "../../components/game/card";
import { getMatch, sendCommand } from "./api";
import { RealtimeClient } from "../../lib/realtime/realtime-client";
import { useConnectionStore } from "../../stores/connection-store";
import type { MatchState } from "./api";
import { TurnTimer } from "../../components/game/turn-timer";

export function MatchPage() {
  const { id = "" } = useParams();
  const client = useQueryClient();
  const navigate = useNavigate();
  const state = useQuery({ queryKey: ["match", id], queryFn: () => getMatch(id), refetchInterval: 2_000 });
  const [selected, setSelected] = useState<string[]>([]);
  const setConnection = useConnectionStore((value) => value.setStatus);
  useEffect(() => {
    const base = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws/v1";
    const socket = new RealtimeClient({
      url: `${base}/matches/${id}/`, onStatus: setConnection,
      onMessage: (message) => {
        if (message.type === "game.state") client.setQueryData(["match", id], message as MatchState);
        if (message.type === "resync.required") client.invalidateQueries({ queryKey: ["match", id] });
      },
    });
    socket.connect();
    return () => socket.disconnect();
  }, [client, id, setConnection]);
  const mutation = useMutation({
    mutationFn: ({ name, payload }: { name: string; payload: object }) => sendCommand(id, state.data!.state_version, name, payload),
    onSuccess: () => { setSelected([]); client.invalidateQueries({ queryKey: ["match", id] }); },
  });
  useEffect(() => {
    if (state.data?.payload.phase === "COMPLETED" || state.data?.payload.phase === "ABANDONED") navigate(`/matches/${id}/result`, { replace: true });
  }, [id, navigate, state.data?.payload.phase]);
  if (!state.data) return <section className="form-page"><p>Sincronizzazione del tavolo…</p></section>;
  const own = state.data.payload.players.find((player) => player.private_hand);
  const active = state.data.payload.players.find((player) => player.seat_index === state.data?.payload.turn_seat);
  const isOwnTurn = own?.seat_index === state.data.payload.turn_seat;
  const playableVisible = own?.private_hand?.length ? own.private_hand : own?.public_face_up_cards ?? [];
  const toggle = (id: string, rank: string) => {
    const chosen = playableVisible.filter((card) => selected.includes(card.id));
    if (selected.includes(id)) setSelected(selected.filter((item) => item !== id));
    else if (!chosen.length || chosen[0].rank === rank) setSelected([...selected, id]);
  };
  const chooseCovered = (cardId: string) => {
    if (own?.privately_seen_face_down_card?.id === cardId) setSelected([cardId]);
    else mutation.mutate({ name: "peek_face_down", payload: { card_id: cardId } });
  };
  return <section className="match-page"><header className="match-heading"><div><p className="eyebrow">Partita in corso</p><h1>Tavolo</h1></div><div><p>Turno di <strong>{active?.display_name}</strong></p><TurnTimer deadline={state.data.deadline} /></div></header>
    {!own && <p className="panel ace-response" role="status">Modalità spettatore · osservazione in sola lettura</p>}
    {state.data.payload.phase === "ACE_TARGET" && state.data.payload.eligible_ace_targets?.length ? <section className="panel ace-panel" role="dialog" aria-labelledby="ace-title"><p className="eyebrow">Effetto dell’asso</p><h2 id="ace-title">Scegli chi riceverà il tavolo</h2><div className="hero-actions">{state.data.payload.eligible_ace_targets.map((target) => <button className="button button-secondary" key={target.id} onClick={() => mutation.mutate({ name: "select_ace_target", payload: { target_player_id: target.id } })}>{target.display_name} · {target.total_card_count} carte</button>)}</div></section> : null}
    {state.data.payload.phase === "ACE_RESPONSE" && own?.seat_index === state.data.payload.turn_seat ? <p className="panel ace-response" role="status">Sei il destinatario dell’asso: raccogli il tavolo oppure rispondi con 2, 10 o asso.</p> : null}
    <div className="opponents">{state.data.payload.players.filter((player) => player.id !== own?.id).map((player) => <article className="panel" key={player.id}><strong>{player.display_name}</strong><p>{player.status}{player.reentry_count ? ` · rientrato ${player.reentry_count}×` : ""} · {player.total_card_count} carte</p><div className="mini-cards">{player.public_face_up_cards.map((card) => <Card card={card} key={card.id} />)}</div></article>)}</div>
    <section className="shared-table panel"><h2>Tavolo</h2><div className="card-row">{state.data.payload.table_cards.length ? state.data.payload.table_cards.map((card) => <Card card={card} key={card.id} />) : <p className="muted">Il tavolo è vuoto.</p>}</div><p>Mazzo: {state.data.payload.deck_count}</p></section>
    {own && <section className="own-area"><h2>Le tue carte</h2><div className="card-row">{playableVisible.map((card) => <Card card={card} key={card.id} selected={selected.includes(card.id)} onClick={() => isOwnTurn && toggle(card.id, card.rank)} />)}{!playableVisible.length && own.own_face_down?.map((card) => <CardBack key={card.id} revealed={own.privately_seen_face_down_card?.id === card.id} onClick={() => isOwnTurn && chooseCovered(card.id)} />)}</div>{own.privately_seen_face_down_card && !playableVisible.length ? <p className="muted">Carta spiata: {own.privately_seen_face_down_card.rank} di {own.privately_seen_face_down_card.suit}. Ora selezionala e giocala.</p> : null}{mutation.error ? <p role="alert">{mutation.error.message}</p> : null}<div className="sticky-actions"><button className="button button-secondary" disabled={!isOwnTurn || mutation.isPending} onClick={() => mutation.mutate({ name: "collect_table", payload: {} })}>Raccogli il tavolo</button><button className="button button-primary" disabled={!isOwnTurn || !selected.length || mutation.isPending} onClick={() => mutation.mutate({ name: "play_cards", payload: { card_ids: selected } })}>Gioca {selected.length || ""}</button><button className="button button-ghost" disabled={!isOwnTurn || mutation.isPending} onClick={() => mutation.mutate({ name: "retire", payload: {} })}>Ritirati</button></div></section>}
  </section>;
}
