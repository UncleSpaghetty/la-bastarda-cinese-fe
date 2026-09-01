import { apiErrorMessage } from "@/lib/api/client";
import { useIdentityForm } from "../hooks/use-identity-form";
import type { Profile } from "../hooks/use-profile-query";

type Props = { profile: Profile; onLoggedOut: () => void; onDirty: (dirty: boolean) => void };

export function IdentityForm({ profile, onLoggedOut, onDirty }: Props) {
  const form = useIdentityForm(onLoggedOut, onDirty);
  return (
    <div className="section-stack">
      <section>
        <h3>Email</h3>
        <dl className="identity-details">
          <div>
            <dt>Indirizzo</dt>
            <dd>{profile.email || "Non impostata"}</dd>
          </div>
          <div>
            <dt>Verifica</dt>
            <dd>{profile.email_verified ? "Verificata" : "Non verificata"}</dd>
          </div>
          {profile.oauth_providers.length > 0 && (
            <div>
              <dt>Accessi collegati</dt>
              <dd>{profile.oauth_providers.join(", ")}</dd>
            </div>
          )}
        </dl>
      </section>
      <form
        className="section-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.mismatch) form.password.mutate();
        }}
      >
        <h3>Cambia password</h3>
        <label>
          Password attuale
          <input
            type="password"
            autoComplete="current-password"
            value={form.current}
            onChange={(event) => form.setCurrent(event.target.value)}
            required
          />
        </label>
        <label>
          Nuova password
          <input
            type="password"
            autoComplete="new-password"
            minLength={10}
            value={form.next}
            onChange={(event) => form.setNext(event.target.value)}
            required
          />
        </label>
        <label>
          Conferma nuova password
          <input
            type="password"
            autoComplete="new-password"
            minLength={10}
            value={form.confirm}
            onChange={(event) => form.setConfirm(event.target.value)}
            aria-invalid={form.mismatch}
            required
          />
        </label>
        {form.mismatch && <p className="field-error">Le password non coincidono.</p>}
        {form.password.isError && (
          <p className="field-error" role="alert">
            {apiErrorMessage(form.password.error, "Password non aggiornata.")}
          </p>
        )}
        {form.message && (
          <p className="form-success" role="status">
            {form.message}
          </p>
        )}
        <div className="form-actions">
          <button
            className="button button-primary"
            disabled={!form.dirty || form.mismatch || form.password.isPending}
          >
            Aggiorna password
          </button>
        </div>
      </form>
      <section className="current-session">
        <h3>Sessione corrente</h3>
        <p>Puoi terminare l'accesso su questo dispositivo.</p>
        <button
          className="button button-secondary"
          onClick={() => form.logout.mutate()}
          disabled={form.logout.isPending}
        >
          Esci dall'account
        </button>
      </section>
    </div>
  );
}
