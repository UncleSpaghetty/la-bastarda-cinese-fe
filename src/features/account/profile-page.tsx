import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

import { ACCOUNT_COPY } from "@/content/copy";
import { apiErrorMessage, apiRequest } from "@/lib/api/client";
import { GoogleButton } from "./google-button";
import { SettingsShell } from "./settings-shell";
import type { SettingsSection } from "./settings-shell";

type IdentityMode = "PROFILE" | "ALIAS" | "ANONYMOUS";
type Preferences = { default_identity_mode?: IdentityMode; confirm_collect?: boolean; effects_volume?: number; reduce_motion?: boolean; auto_open_history?: boolean; spectator_enabled?: boolean };
type Profile = { id: number; username: string; email: string; email_verified: boolean; avatar_url: string; preferences: Preferences; oauth_providers: string[] };

export function ProfilePage() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => apiRequest<Profile>("/profile"), retry: false });
  const [active, setActive] = useState<SettingsSection>("profile");
  const [dirty, setDirty] = useState(false);
  useEffect(() => { const guard = (event: BeforeUnloadEvent) => { if (!dirty) return; event.preventDefault(); event.returnValue = ""; }; window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard); }, [dirty]);
  useEffect(() => {
    const guardLinks = (event: MouseEvent) => {
      if (!dirty) return;
      const link = (event.target as HTMLElement).closest("a[href]");
      if (link && !window.confirm("Hai modifiche non salvate. Vuoi uscire e scartarle?")) event.preventDefault();
    };
    document.addEventListener("click", guardLinks, true);
    return () => document.removeEventListener("click", guardLinks, true);
  }, [dirty]);
  const navigateSection = (next: SettingsSection) => {
    if (next === active) return;
    if (dirty && !window.confirm("Hai modifiche non salvate. Vuoi scartarle e cambiare sezione?")) return;
    setDirty(false); setActive(next);
  };
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["profile"] });

  return <section className="account-page page-container"><header className="page-heading"><p className="eyebrow">ACCOUNT E IMPOSTAZIONI</p><h1>{ACCOUNT_COPY.title}</h1><p>{ACCOUNT_COPY.description}</p></header>
    {profile.isLoading && <div className="account-skeleton"><aside /><main /></div>}
    {profile.isError && <AuthGateway onSuccess={refresh} />}
    {profile.data && <SettingsShell active={active} dirty={dirty} onNavigate={navigateSection}>
      {active === "profile" && <PublicProfileForm profile={profile.data} onSaved={refresh} onDirty={setDirty} />}
      {active === "identity" && <IdentityForm profile={profile.data} onLoggedOut={refresh} onDirty={setDirty} />}
      {active === "preferences" && <PreferencesForm profile={profile.data} onSaved={refresh} onDirty={setDirty} />}
      {active === "privacy" && <PrivacySection />}
    </SettingsShell>}
  </section>;
}

function AuthGateway({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const login = useMutation({ mutationFn: () => apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }), onSuccess });
  const register = useMutation({ mutationFn: () => apiRequest("/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) }), onSuccess });
  const google = useMutation({ mutationFn: (credential: string) => apiRequest("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }), onSuccess });
  const googleCredential = useCallback((credential: string) => google.mutate(credential), [google]);
  return <div className="auth-gateway"><div><p className="eyebrow">IDENTITÀ PERSISTENTE</p><h2>Ricordati le partite. Anche quelle che vorresti negare.</h2><p>Accedi per conservare profilo, storico e statistiche.</p></div><div className="account-grid">
    <form className="panel form-stack" onSubmit={(event) => { event.preventDefault(); login.mutate(); }}><h2>Accedi</h2><label>Username<input value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{login.isError && <p className="field-error" role="alert">{apiErrorMessage(login.error, "Accesso non riuscito.")}</p>}<button className="button button-primary" disabled={login.isPending}>Accedi</button></form>
    <form className="panel form-stack" onSubmit={(event) => { event.preventDefault(); register.mutate(); }}><h2>Crea un account</h2><label>Username<input value={username} autoComplete="username" minLength={3} onChange={(event) => setUsername(event.target.value)} required /></label><label>Email<input type="email" value={email} autoComplete="email" onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="new-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{register.isError && <p className="field-error" role="alert">{apiErrorMessage(register.error, "Registrazione non riuscita.")}</p>}<button className="button button-primary" disabled={register.isPending}>Crea account e collega lo storico</button></form>
    <div className="panel form-stack"><h2>Continua con Google</h2><GoogleButton onCredential={googleCredential} />{google.isError && <p className="field-error" role="alert">Accesso Google non riuscito.</p>}</div>
  </div></div>;
}

function PublicProfileForm({ profile, onSaved, onDirty }: FormProps) {
  const [username, setUsername] = useState(profile.username); const [identity, setIdentity] = useState<IdentityMode>(profile.preferences.default_identity_mode ?? "PROFILE"); const [message, setMessage] = useState("");
  const [baseline, setBaseline] = useState({ username: profile.username, identity: profile.preferences.default_identity_mode ?? "PROFILE" });
  const dirty = username !== baseline.username || identity !== baseline.identity;
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  const save = useMutation({ mutationFn: () => apiRequest<Profile>("/profile", { method: "PATCH", body: JSON.stringify({ username, preferences: { default_identity_mode: identity } }) }), onSuccess: () => { setBaseline({ username, identity }); setMessage("Profilo salvato."); onSaved(); onDirty(false); } });
  const upload = useMutation({ mutationFn: (file: File) => { const body = new FormData(); body.append("avatar", file); return apiRequest("/profile/avatar", { method: "POST", body }); }, onSuccess: () => { setMessage("Avatar aggiornato."); onSaved(); } });
  return <form className="section-form" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}><div className="avatar-editor"><div className="account-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar attuale" /> : profile.username.slice(0, 2).toUpperCase()}</div><label className="button button-secondary">Cambia avatar<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload.mutate(file); }} /></label><small>PNG, JPG o WebP. Massimo 2 MB.</small></div><label>Nome visualizzato<input value={username} minLength={3} maxLength={150} onChange={(event) => setUsername(event.target.value)} required /></label><label>Username<input value={`@${username}`} disabled aria-describedby="username-help" /></label><small id="username-help">Lo username segue il nome del profilo.</small><fieldset><legend>Come comparire al tavolo per impostazione predefinita</legend><div className="choice-list">{(["PROFILE", "ALIAS", "ANONYMOUS"] as const).map((mode) => <label key={mode}><input type="radio" name="identity" checked={identity === mode} onChange={() => setIdentity(mode)} /><span><strong>{{ PROFILE: "Profilo", ALIAS: "Alias", ANONYMOUS: "Anonimo" }[mode]}</strong><small>{{ PROFILE: "Mostra nome e avatar del tuo account.", ALIAS: "Scegli un nome diverso per la stanza.", ANONYMOUS: "Usa un’identità casuale nella stanza." }[mode]}</small></span></label>)}</div></fieldset>{save.isError && <p className="field-error" role="alert">{apiErrorMessage(save.error, "Profilo non salvato.")}</p>}{message && <p className="form-success" role="status">{message}</p>}<div className="form-actions"><button className="button button-primary" disabled={!dirty || save.isPending}>Salva profilo</button></div></form>;
}

function IdentityForm({ profile, onLoggedOut, onDirty }: { profile: Profile; onLoggedOut: () => void; onDirty: (dirty: boolean) => void }) {
  const [current, setCurrent] = useState(""); const [next, setNext] = useState(""); const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState("");
  const dirty = Boolean(current || next || confirm); useEffect(() => onDirty(dirty), [dirty, onDirty]);
  const password = useMutation({ mutationFn: () => apiRequest("/auth/password", { method: "POST", body: JSON.stringify({ current_password: current, new_password: next }) }), onSuccess: () => { setCurrent(""); setNext(""); setConfirm(""); setMessage("Password aggiornata."); onDirty(false); } });
  const logout = useMutation({ mutationFn: () => apiRequest("/auth/logout", { method: "POST" }), onSuccess: onLoggedOut });
  const mismatch = confirm.length > 0 && next !== confirm;
  return <div className="section-stack"><section><h3>Email</h3><dl className="identity-details"><div><dt>Indirizzo</dt><dd>{profile.email || "Non impostata"}</dd></div><div><dt>Verifica</dt><dd>{profile.email_verified ? "Verificata" : "Non verificata"}</dd></div>{profile.oauth_providers.length > 0 && <div><dt>Accessi collegati</dt><dd>{profile.oauth_providers.join(", ")}</dd></div>}</dl></section><form className="section-form" onSubmit={(event) => { event.preventDefault(); if (!mismatch) password.mutate(); }}><h3>Cambia password</h3><label>Password attuale<input type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} required /></label><label>Nuova password<input type="password" autoComplete="new-password" minLength={10} value={next} onChange={(event) => setNext(event.target.value)} required /></label><label>Conferma nuova password<input type="password" autoComplete="new-password" minLength={10} value={confirm} onChange={(event) => setConfirm(event.target.value)} aria-invalid={mismatch} required /></label>{mismatch && <p className="field-error">Le password non coincidono.</p>}{password.isError && <p className="field-error" role="alert">{apiErrorMessage(password.error, "Password non aggiornata.")}</p>}{message && <p className="form-success" role="status">{message}</p>}<div className="form-actions"><button className="button button-primary" disabled={!dirty || mismatch || password.isPending}>Aggiorna password</button></div></form><section className="current-session"><h3>Sessione corrente</h3><p>Puoi terminare l’accesso su questo dispositivo.</p><button className="button button-secondary" onClick={() => logout.mutate()} disabled={logout.isPending}>Esci dall’account</button></section></div>;
}

function PreferencesForm({ profile, onSaved, onDirty }: FormProps) {
  const initial = { confirm_collect: profile.preferences.confirm_collect ?? true, effects_volume: profile.preferences.effects_volume ?? 70, reduce_motion: profile.preferences.reduce_motion ?? false, auto_open_history: profile.preferences.auto_open_history ?? false, spectator_enabled: profile.preferences.spectator_enabled ?? true };
  const [values, setValues] = useState(initial); const [baseline, setBaseline] = useState(initial); const [message, setMessage] = useState(""); const dirty = JSON.stringify(values) !== JSON.stringify(baseline); useEffect(() => onDirty(dirty), [dirty, onDirty]);
  const save = useMutation({ mutationFn: () => apiRequest("/profile", { method: "PATCH", body: JSON.stringify({ preferences: values }) }), onSuccess: () => { setBaseline(values); setMessage("Preferenze salvate."); onSaved(); onDirty(false); } });
  const toggle = (key: keyof typeof values) => <label className="preference-row"><span><strong>{{ confirm_collect: "Conferma prima di raccogliere", reduce_motion: "Riduci le animazioni", auto_open_history: "Apri automaticamente la cronologia", spectator_enabled: "Proponi il ruolo spectator" }[key as Exclude<keyof typeof values, "effects_volume">]}</strong></span><input type="checkbox" checked={Boolean(values[key])} onChange={(event) => setValues({ ...values, [key]: event.target.checked })} /></label>;
  return <form className="section-form" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>{toggle("confirm_collect")}{toggle("reduce_motion")} {toggle("auto_open_history")}{toggle("spectator_enabled")}<label>Volume degli effetti <output>{values.effects_volume}%</output><input type="range" min="0" max="100" step="5" value={values.effects_volume} onChange={(event) => setValues({ ...values, effects_volume: Number(event.target.value) })} /></label>{save.isError && <p className="field-error" role="alert">{apiErrorMessage(save.error, "Preferenze non salvate.")}</p>}{message && <p className="form-success" role="status">{message}</p>}<div className="form-actions"><button className="button button-primary" disabled={!dirty || save.isPending}>Salva preferenze</button></div></form>;
}

function PrivacySection() { return <div className="privacy-section"><section><h3>Cosa conserviamo</h3><p>Il profilo collega al tuo account risultati, ritiri, timeout e azioni aggregate. Le carte private degli altri non compaiono nello storico.</p></section><section><h3>Storico e statistiche</h3><p>Controlla i dati che il tavolo ha registrato sul tuo account.</p><Link className="button button-secondary" to="/history">Apri lo storico delle partite</Link></section><p className="privacy-note">Esportazione e cancellazione dell’account non sono ancora supportate dal backend, quindi qui non mostriamo azioni che non potremmo completare in sicurezza.</p></div>; }

type FormProps = { profile: Profile; onSaved: () => void; onDirty: (dirty: boolean) => void };
