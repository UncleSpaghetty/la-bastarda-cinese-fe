import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router";

import { Card, CardBack } from "../../components/game/card";
import { getMatch, sendCommand } from "./api";

export function MatchPage() {
  const { id = "" } = useParams();
  const client = useQueryClient();
  const state = useQuery({ queryKey: ["match", id], queryFn: () => getMatch(id), refetchInterval: 2_000 });
  const [selected, setSelected] = useState<string[]>([]);
  const mutation = useMutation({
    mutationFn: ({ name, payload }: { name: string; payload: object }) => sendCommand(id, state.data!.state_version, name, payload),
    onSuccess: () => { setSelected([]); client.invalidateQueries({ queryKey: ["match", id] }); },
  });
  if (!state.data) return <section className="form-page"><p>Sincronizzazione del tavolo…</p></section>;
  const own = state.data.payload.players.find((player) => player.private_hand);
  const active = state.data.payload.players.find((player) => player.seat_index === state.data?.payload.turn_seat);
  const toggle = (id: string, rank: string) => {
    const chosen = own?.private_hand?.filter((card) => selected.includes(card.id)) ?? [];
    if (selected.includes(id)) setSelected(selected.filter((item) => item !== id));
    else if (!chosen.length || chosen[0].rank === rank) setSelected([...selected, id]);
  };
  return <section className="match-page"><header className="match-heading"><div><p className="eyebrow">Partita in corso</p><h1>Tavolo</h1></div><p>Turno di <strong>{active?.display_name}</strong></p></header>
    <div className="opponents">{state.data.payload.players.filter((player) => player.id !== own?.id).map((player) => <article className="panel" key={player.id}><strong>{player.display_name}</strong><p>{player.total_card_count} carte</p><div className="mini-cards">{player.public_face_up_cards.map((card) => <Card card={card} key={card.id} />)}</div></article>)}</div>
    <section className="shared-table panel"><h2>Tavolo</h2><div className="card-row">{state.data.payload.table_cards.length ? state.data.payload.table_cards.map((card) => <Card card={card} key={card.id} />) : <p className="muted">Il tavolo è vuoto.</p>}</div><p>Mazzo: {state.data.payload.deck_count}</p></section>
    {own && <section className="own-area"><h2>La tua mano</h2><div className="card-row">{own.private_hand?.map((card) => <Card card={card} key={card.id} selected={selected.includes(card.id)} onClick={() => toggle(card.id, card.rank)} />)}{own.own_face_down?.map((card) => <CardBack key={card.id} />)}</div><div className="sticky-actions"><button className="button button-secondary" onClick={() => mutation.mutate({ name: "collect_table", payload: {} })}>Raccogli il tavolo</button><button className="button button-primary" disabled={!selected.length || mutation.isPending} onClick={() => mutation.mutate({ name: "play_cards", payload: { card_ids: selected } })}>Gioca {selected.length || ""}</button></div></section>}
  </section>;
}
