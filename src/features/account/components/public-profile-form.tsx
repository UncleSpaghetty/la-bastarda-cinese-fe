import { apiErrorMessage } from "@/lib/api/client";
import { usePublicProfileForm } from "../hooks/use-public-profile-form";
import type { Profile } from "../hooks/use-profile-query";

type Props = { profile: Profile; onSaved: () => void; onDirty: (dirty: boolean) => void };

export function PublicProfileForm({ profile, onSaved, onDirty }: Props) {
  const form = usePublicProfileForm(profile, onSaved, onDirty);
  return (
    <form
      className="section-form"
      onSubmit={(event) => {
        event.preventDefault();
        form.save.mutate();
      }}
    >
      <div className="avatar-editor">
        <div className="account-avatar">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar attuale" />
          ) : (
            profile.username.slice(0, 2).toUpperCase()
          )}
        </div>
        <label className="button button-secondary">
          Cambia avatar
          <input
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) form.upload.mutate(file);
            }}
          />
        </label>
        <small>PNG, JPG o WebP. Massimo 2 MB.</small>
      </div>
      <label>
        Nome visualizzato
        <input
          value={form.username}
          minLength={3}
          maxLength={150}
          onChange={(event) => form.setUsername(event.target.value)}
          required
        />
      </label>
      <label>
        Username
        <input value={`@${form.username}`} disabled aria-describedby="username-help" />
      </label>
      <small id="username-help">Lo username segue il nome del profilo.</small>
      <fieldset>
        <legend>Come comparire al tavolo per impostazione predefinita</legend>
        <div className="choice-list">
          {(["PROFILE", "ALIAS", "ANONYMOUS"] as const).map((mode) => (
            <label key={mode}>
              <input
                type="radio"
                name="identity"
                checked={form.identity === mode}
                onChange={() => form.setIdentity(mode)}
              />
              <span>
                <strong>
                  {{ PROFILE: "Profilo", ALIAS: "Alias", ANONYMOUS: "Anonimo" }[mode]}
                </strong>
                <small>
                  {
                    {
                      PROFILE: "Mostra nome e avatar del tuo account.",
                      ALIAS: "Scegli un nome diverso per la stanza.",
                      ANONYMOUS: "Usa un'identità casuale nella stanza.",
                    }[mode]
                  }
                </small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {form.save.isError && (
        <p className="field-error" role="alert">
          {apiErrorMessage(form.save.error, "Profilo non salvato.")}
        </p>
      )}
      {form.message && (
        <p className="form-success" role="status">
          {form.message}
        </p>
      )}
      <div className="form-actions">
        <button className="button button-primary" disabled={!form.dirty || form.save.isPending}>
          Salva profilo
        </button>
      </div>
    </form>
  );
}
