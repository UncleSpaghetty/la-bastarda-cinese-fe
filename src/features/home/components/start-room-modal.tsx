import { apiErrorMessage } from "@/lib/api/client";
import { ArrowLeft, X } from "lucide-react";

import type { useStartRoomModal } from "../hooks/use-create-room";

/** Choice between login, registration or an alias, shown before a room is created. */
export function StartRoomModal({ state }: { state: ReturnType<typeof useStartRoomModal> }) {
  if (!state.open) return null;
  const back = () => state.setStep("choice");

  return (
    <div className="modal-overlay" role="presentation" onClick={state.closeModal}>
      <section
        className="modal-dialog panel"
        role="dialog"
        aria-modal="true"
        aria-label="Prima di sederti al tavolo"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          type="button"
          aria-label="Chiudi"
          onClick={state.closeModal}
        >
          <X />
        </button>

        {state.step === "choice" && (
          <>
            <p className="eyebrow">PRIMA DI SEDERTI AL TAVOLO</p>
            <h2>Accedi per non perdere lo storico</h2>
            <p>
              Con un account salviamo automaticamente vittorie, ritiri e statistiche. Oppure gioca
              subito con un alias, senza salvataggio permanente.
            </p>
            <div className="modal-choice-grid">
              <button
                className="button button-primary"
                type="button"
                onClick={() => state.setStep("login")}
              >
                Accedi
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => state.setStep("register")}
              >
                Crea un account
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => state.setStep("alias")}
              >
                Continua con un alias
              </button>
            </div>
          </>
        )}

        {state.step === "login" && (
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              state.login.mutate();
            }}
          >
            <button className="modal-back" type="button" onClick={back}>
              <ArrowLeft size={16} /> Indietro
            </button>
            <h2>Accedi</h2>
            <label>
              Username
              <input
                value={state.username}
                autoComplete="username"
                onChange={(event) => state.setUsername(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                minLength={10}
                value={state.password}
                onChange={(event) => state.setPassword(event.target.value)}
                required
              />
            </label>
            {state.login.isError && (
              <p className="field-error" role="alert">
                {apiErrorMessage(state.login.error, "Accesso non riuscito.")}
              </p>
            )}
            <button
              className="button button-primary"
              disabled={state.login.isPending || state.launch.isPending}
            >
              Accedi e crea il tavolo
            </button>
          </form>
        )}

        {state.step === "register" && (
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              state.register.mutate();
            }}
          >
            <button className="modal-back" type="button" onClick={back}>
              <ArrowLeft size={16} /> Indietro
            </button>
            <h2>Crea un account</h2>
            <label>
              Username
              <input
                value={state.username}
                autoComplete="username"
                minLength={3}
                onChange={(event) => state.setUsername(event.target.value)}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={state.email}
                autoComplete="email"
                onChange={(event) => state.setEmail(event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="new-password"
                minLength={10}
                value={state.password}
                onChange={(event) => state.setPassword(event.target.value)}
                required
              />
            </label>
            {state.register.isError && (
              <p className="field-error" role="alert">
                {apiErrorMessage(state.register.error, "Registrazione non riuscita.")}
              </p>
            )}
            <button
              className="button button-primary"
              disabled={state.register.isPending || state.launch.isPending}
            >
              Crea l'account e il tavolo
            </button>
          </form>
        )}

        {state.step === "alias" && (
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              state.submitAlias();
            }}
          >
            <button className="modal-back" type="button" onClick={back}>
              <ArrowLeft size={16} /> Indietro
            </button>
            <h2>Il tuo nome al tavolo</h2>
            <p className="muted">
              Senza account, lo storico di questa partita non verrà conservato.
            </p>
            <label>
              Alias
              <input
                value={state.alias}
                minLength={2}
                maxLength={32}
                placeholder="Come ti chiameranno quando perderai?"
                onChange={(event) => state.setAlias(event.target.value)}
                required
              />
            </label>
            {state.launch.isError && (
              <p className="field-error" role="alert">
                Non è stato possibile creare la stanza.
              </p>
            )}
            <button
              className="button button-primary"
              disabled={state.launch.isPending || state.alias.trim().length < 2}
            >
              Crea il tavolo
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
