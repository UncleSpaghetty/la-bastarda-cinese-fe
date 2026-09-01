import { ArrowRight, Eye, Swords, Users } from "lucide-react";

import { HOME_COPY } from "@/content/copy";
import { useCreateRoom } from "./hooks/use-create-room";

export function HomePage() {
  const room = useCreateRoom();

  return (
    <div className="home-page">
      <section className="home-hero page-container">
        <div className="hero-copy">
          <p className="eyebrow">{HOME_COPY.eyebrow}</p>
          <h1>{HOME_COPY.title}</h1>
          <p className="hero-lead">{HOME_COPY.description}</p>
          <form
            className="create-room-form"
            onSubmit={(event) => {
              event.preventDefault();
              room.submit();
            }}
          >
            <label htmlFor="host-name">Il tuo nome al tavolo</label>
            <div>
              <input
                id="host-name"
                value={room.hostName}
                minLength={2}
                maxLength={32}
                placeholder="Come ti chiameranno quando perderai?"
                onChange={(event) => room.setHostName(event.target.value)}
                required
              />
              <button
                className="button button-primary"
                type="submit"
                disabled={room.isPending || room.hostName.trim().length < 2}
              >
                {HOME_COPY.primaryCta} <ArrowRight size={18} />
              </button>
            </div>
          </form>
          <button className="text-cta" type="button" onClick={room.enterInvite}>
            {HOME_COPY.secondaryCta} <ArrowRight size={16} />
          </button>
          <p className="hero-microcopy">{HOME_COPY.microcopy}</p>
        </div>
        <div className="table-preview" aria-label="Anteprima del tavolo da gioco">
          <div className="avatar avatar-lilac">LM</div>
          <div className="avatar avatar-coral">AR</div>
          <div className="playing-card card-one">
            <span>A</span>
            <span>♥</span>
          </div>
          <div className="playing-card card-two">
            <span>10</span>
            <span>♣</span>
          </div>
          <div className="deck" aria-label="Mazzo coperto">
            <span>B</span>
          </div>
          <p>Tavolo</p>
        </div>
      </section>

      <section className="home-section home-intro page-container">
        <Swords aria-hidden="true" />
        <div>
          <p className="eyebrow">LE REGOLE DEL DISASTRO</p>
          <h2>{HOME_COPY.intro.title}</h2>
          <p>{HOME_COPY.intro.description}</p>
        </div>
      </section>
      <section className="home-section page-container" aria-labelledby="special-cards-title">
        <p className="eyebrow">CARTE SPECIALI</p>
        <h2 id="special-cards-title">{HOME_COPY.specials.title}</h2>
        <div className="special-card-grid">
          {HOME_COPY.specials.cards.map(([rank, description]) => (
            <article key={rank} className="special-rule">
              <strong>{rank}</strong>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="home-feature-band">
        <div className="page-container home-feature-grid">
          <article>
            <Users aria-hidden="true" />
            <p className="eyebrow">MULTIPLAYER PRIVATO</p>
            <h2>{HOME_COPY.multiplayer.title}</h2>
            <p>{HOME_COPY.multiplayer.description}</p>
          </article>
          <article>
            <Eye aria-hidden="true" />
            <p className="eyebrow">MODALITÀ SPECTATOR</p>
            <h2>{HOME_COPY.spectator.title}</h2>
            <p>{HOME_COPY.spectator.description}</p>
          </article>
        </div>
      </section>
      <section className="home-final-cta page-container">
        <p>Nessun disastro registrato. Per ora.</p>
        <button
          className="button button-primary"
          type="button"
          onClick={() => document.getElementById("host-name")?.focus()}
        >
          Crea la prima partita
        </button>
      </section>
    </div>
  );
}
