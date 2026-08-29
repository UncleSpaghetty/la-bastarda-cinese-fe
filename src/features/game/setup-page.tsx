import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Card, CardBack } from "../../components/game/card";
import { confirmCards, getMatch, swapCards } from "./api";

export function SetupPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const state = useQuery({ queryKey: ["match", id], queryFn: () => getMatch(id), refetchInterval: 2_000 });
  const [hand, setHand] = useState<string[]>([]);
  const [up, setUp] = useState<string[]>([]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["match", id] });
  const swap = useMutation({ mutationFn: () => swapCards(id, hand, up), onSuccess: refresh });
  const confirm = useMutation({ mutationFn: () => confirmCards(id), onSuccess: () => { refresh(); navigate(`/matches/${id}`); } });
  const own = state.data?.payload.players.find((player) => player.private_hand);
  if (!own) return <section className="form-page"><p>Preparazione delle carte…</p></section>;
  const toggle = (values: string[], set: (value: string[]) => void, cardId: string) => set(values.includes(cardId) ? values.filter((item) => item !== cardId) : values.length < 3 ? [...values, cardId] : values);
  return <section className="setup-page"><p className="eyebrow">Preparazione</p><h1>Scegli il tuo assetto.</h1><p className="muted">Puoi effettuare un solo scambio da zero a tre carte.</p>
    <div className="card-section"><h2>Carte scoperte</h2><div className="card-row">{own.public_face_up_cards.map((card) => <Card key={card.id} card={card} selected={up.includes(card.id)} onClick={() => toggle(up, setUp, card.id)} />)}</div></div>
    <div className="card-section"><h2>Carte coperte</h2><div className="card-row">{own.own_face_down?.map((card) => <CardBack key={card.id} />)}</div></div>
    <div className="card-section"><h2>La tua mano</h2><div className="card-row">{own.private_hand?.map((card) => <Card key={card.id} card={card} selected={hand.includes(card.id)} onClick={() => toggle(hand, setHand, card.id)} />)}</div></div>
    <div className="sticky-actions"><button className="button button-secondary" disabled={hand.length !== up.length || swap.isPending} onClick={() => swap.mutate()}>Conferma scambio ({hand.length})</button><button className="button button-primary" disabled={confirm.isPending} onClick={() => confirm.mutate()}>Conferma carte</button></div>
  </section>;
}
