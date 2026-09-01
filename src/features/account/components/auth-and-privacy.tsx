import { useCallback, useState } from "react";
import { Link } from "react-router";

import { apiErrorMessage } from "@/lib/api/client";
import { useAuthGateway } from "../hooks/use-profile-query";
import { GoogleButton } from "../google-button";

export function AuthGateway({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, register, google } = useAuthGateway(onSuccess);
  const googleCredential = useCallback((credential: string) => google.mutate(credential), [google]);

  return (
    <div className="auth-gateway">
      <div>
        <p className="eyebrow">IDENTITÀ PERSISTENTE</p>
        <h2>Ricordati le partite. Anche quelle che vorresti negare.</h2>
        <p>Accedi per conservare profilo, storico e statistiche.</p>
      </div>
      <div className="account-grid">
        <form
          className="panel form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            login.mutate({ username, password });
          }}
        >
          <h2>Accedi</h2>
          <label>
            Username
            <input
              value={username}
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              minLength={10}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {login.isError && (
            <p className="field-error" role="alert">
              {apiErrorMessage(login.error, "Accesso non riuscito.")}
            </p>
          )}
          <button className="button button-primary" disabled={login.isPending}>
            Accedi
          </button>
        </form>
        <form
          className="panel form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            register.mutate({ username, email, password });
          }}
        >
          <h2>Crea un account</h2>
          <label>
            Username
            <input
              value={username}
              autoComplete="username"
              minLength={3}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {register.isError && (
            <p className="field-error" role="alert">
              {apiErrorMessage(register.error, "Registrazione non riuscita.")}
            </p>
          )}
          <button className="button button-primary" disabled={register.isPending}>
            Crea account e collega lo storico
          </button>
        </form>
        <div className="panel form-stack">
          <h2>Continua con Google</h2>
          <GoogleButton onCredential={googleCredential} />
          {google.isError && (
            <p className="field-error" role="alert">
              Accesso Google non riuscito.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PrivacySection() {
  return (
    <div className="privacy-section">
      <section>
        <h3>Cosa conserviamo</h3>
        <p>
          Il profilo collega al tuo account risultati, ritiri, timeout e azioni aggregate. Le carte
          private degli altri non compaiono nello storico.
        </p>
      </section>
      <section>
        <h3>Storico e statistiche</h3>
        <p>Controlla i dati che il tavolo ha registrato sul tuo account.</p>
        <Link className="button button-secondary" to="/history">
          Apri lo storico delle partite
        </Link>
      </section>
      <p className="privacy-note">
        Esportazione e cancellazione dell'account non sono ancora supportate dal backend, quindi qui
        non mostriamo azioni che non potremmo completare in sicurezza.
      </p>
    </div>
  );
}
