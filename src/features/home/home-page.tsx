import { ArrowRight, ShieldCheck, Users } from "lucide-react";

export function HomePage() {
  return <section className="hero">
    <div className="hero-copy">
      <p className="eyebrow">Carte, amici, nessun bluff del client.</p>
      <h1>Il tavolo digitale per la vostra serata.</h1>
      <p className="hero-lead">Stanze private, partite realtime e regole gestite dal server. Da quattro a dieci giocatori, con posto anche per chi vuole guardare.</p>
      <div className="hero-actions">
        <button className="button button-primary" type="button">Crea una stanza <ArrowRight size={18} /></button>
        <button className="button button-secondary" type="button">Ho un invito</button>
      </div>
      <ul className="trust-list" aria-label="Caratteristiche principali">
        <li><ShieldCheck aria-hidden="true" /> Carte private protette</li>
        <li><Users aria-hidden="true" /> Giocatori e spectator</li>
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
