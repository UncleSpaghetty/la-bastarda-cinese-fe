import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LazyMotion, domAnimation, m } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Card, CardBack } from "../../components/game/card";
import { ActionFeedback } from "../../components/feedback/action-feedback";
import { TurnTimer } from "../../components/game/turn-timer";
import { apiErrorMessage } from "../../lib/api/client";
import { confirmCards, getMatch, swapCards } from "./api";
import type { PlayingCard } from "./api";

export function SetupPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const state = useQuery({ queryKey: ["match", id], queryFn: () => getMatch(id), refetchInterval: 2_000 });
  const [hand, setHand] = useState<string[]>([]);
  const [up, setUp] = useState<string[]>([]);
  const [swapped, setSwapped] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["match", id] });
  const swap = useMutation({ mutationFn: () => swapCards(id, hand, up), onSuccess: () => { setSwapped(true); setHand([]); setUp([]); refresh(); } });
  const confirm = useMutation({ mutationFn: () => confirmCards(id), onSuccess: () => { refresh(); navigate(`/matches/${id}`); } });
  const own = state.data?.payload.players.find((player) => player.private_hand);
  useEffect(() => {
    if (state.data && !own) navigate(`/matches/${id}`, { replace: true });
  }, [id, navigate, own, state.data]);
  useEffect(() => {
    if (state.data && state.data.payload.phase !== "SETUP_SWAP") navigate(`/matches/${id}`, { replace: true });
  }, [id, navigate, state.data]);
  if (!own) return <section className="form-page"><p>Preparazione delle carte…</p></section>;
  const toggle = (values: string[], set: (value: string[]) => void, cardId: string) => set(values.includes(cardId) ? values.filter((item) => item !== cardId) : values.length < 3 ? [...values, cardId] : values);
  const error = swap.error ?? confirm.error;
  return <section className={`setup-page ${swap.isPending ? "swap-in-progress" : ""}`}><ActionFeedback message={error ? apiErrorMessage(error, "Non è stato possibile preparare le carte.") : swapped ? "Scambio completato. Niente ripensamenti, campione." : undefined} tone={error ? "error" : "success"} /><div className="setup-heading"><div><p className="eyebrow">Preparazione</p><h1>Scegli il tuo assetto.</h1><p className="muted">Puoi effettuare un solo scambio da zero a tre carte.</p></div><TurnTimer deadline={state.data?.deadline ?? null} label="Inizio automatico" /></div>
    <div className="swap-lane" aria-hidden="true"><span>Mano</span><i>⇄</i><span>Tavolo</span></div>
    <div className="card-section"><h2>Carte scoperte <small>· trascina o tocca per scambiare</small></h2><div className="card-row">{own.public_face_up_cards.map((card) => <DraggableSwapCard key={card.id} card={card} selected={up.includes(card.id)} swapping={swap.isPending && up.includes(card.id)} onSelect={() => toggle(up, setUp, card.id)} />)}</div></div>
    <div className="card-section"><h2>Carte coperte</h2><div className="card-row">{own.own_face_down?.map((card) => <CardBack key={card.id} />)}</div></div>
    <div className="card-section"><h2>La tua mano <small>· trascina o tocca per scambiare</small></h2><div className="card-row">{own.private_hand?.map((card) => <DraggableSwapCard key={card.id} card={card} selected={hand.includes(card.id)} swapping={swap.isPending && hand.includes(card.id)} onSelect={() => toggle(hand, setHand, card.id)} />)}</div></div>
    <div className="sticky-actions"><button className="button button-secondary" disabled={swapped || hand.length !== up.length || swap.isPending} onClick={() => swap.mutate()}>{swap.isPending ? "Scambio in corso…" : `Conferma scambio (${hand.length})`}</button><button className="button button-primary" disabled={confirm.isPending} onClick={() => confirm.mutate()}>Conferma carte</button></div>
  </section>;
}

function DraggableSwapCard({ card, selected, swapping, onSelect }: { card: PlayingCard; selected: boolean; swapping: boolean; onSelect: () => void }) {
  return <LazyMotion features={domAnimation}><m.div className="draggable-card" layout drag="y" dragConstraints={{ top: -65, bottom: 65 }} dragElastic={.18} dragSnapToOrigin whileDrag={{ scale: 1.06, rotate: 2, zIndex: 5 }} onDragEnd={(_event, info) => { if (Math.abs(info.offset.y) > 35) onSelect(); }}>
    <Card card={card} selected={selected} animation={swapping ? "swap" : undefined} onClick={onSelect} />
  </m.div></LazyMotion>;
}
