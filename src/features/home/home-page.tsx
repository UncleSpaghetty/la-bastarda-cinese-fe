import { ArrowRight, ShieldCheck, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useState } from "react";

import { createRoom, ensureGuest } from "../rooms/api";

export function HomePage() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState(() => localStorage.getItem("lbc_alias") ?? "");
  const mutation = useMutation({ mutationFn: async () => {
    await ensureGuest();
    const displayName = hostName.trim();
    localStorage.setItem("lbc_alias", displayName);
    return createRoom(displayName);
  }, onSuccess: (room) => {
    if (room.invite_token) sessionStorage.setItem(`lbc_invite_${room.id}`, room.invite_token);
    navigate(`/rooms/${room.id}`);
  } });
  return <section className="hero">
    <div className="hero-copy">
      <p className="eyebrow">Carte, amici, nessun bluff del client.</p>
      <h1>Il tavolo digitale per la vostra serata.</h1>
      <p className="hero-lead">Stanze private, partite realtime e regole gestite dal server. Da quattro a dieci giocatori, con posto anche per chi vuole guardare.</p>
      <form className="create-room-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <label htmlFor="host-name">Il tuo nome al tavolo</label><div><input id="host-name" value={hostName} minLength={2} maxLength={32} placeholder="Non chiamarti semplicemente Host" onChange={(event) => setHostName(event.target.value)} required /><button className="button button-primary" type="submit" disabled={mutation.isPending || hostName.trim().length < 2}>Crea stanza <ArrowRight size={18} /></button></div>
      </form>
      <div className="hero-actions">
        <button className="button button-secondary" type="button" onClick={() => {
          const token = window.prompt("Incolla il token di invito");
          if (token?.trim()) navigate(`/invite/${token.trim()}`);
        }}>Ho un invito</button>
      </div>
      <ul className="trust-list" aria-label="Caratteristiche principali">
        <li><ShieldCheck aria-hidden="true" /> Carte private protette</li>
        <li><Users aria-hidden="true" /> Giocatori e spettatori</li>
      </ul>
    </div>
    <div className="table-preview" aria-label="Anteprima del tavolo da gioco">
      <div className="avatar avatar-lilac">LM</div><div className="avatar avatar-coral">AR</div>
      <div className="playing-card card-one"><span>A</span><span>♥</span></div>
      <div className="playing-card card-two"><span>10</span><span>♣</span></div>
      <div className="deck" aria-label="Mazzo coperto"><span>B</span></div>
      <p>Tavolo</p>
    </div>
  </section>;
}
