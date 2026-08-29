import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { apiRequest } from "../../lib/api/client";
import { GoogleButton } from "./google-button";

type Profile = { id: number; username: string; avatar_url: string; preferences: Record<string, unknown> };

export function ProfilePage() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => apiRequest<Profile>("/profile"), retry: false });
  const stats = useQuery({ queryKey: ["statistics"], queryFn: () => apiRequest<Record<string, number>>("/statistics") });
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["profile"] });
  const register = useMutation({ mutationFn: () => apiRequest("/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) }), onSuccess: refresh });
  const login = useMutation({ mutationFn: () => apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }), onSuccess: refresh });
  const google = useMutation({ mutationFn: (credential: string) => apiRequest("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }), onSuccess: refresh });
  const googleCredential = useCallback((credential: string) => google.mutate(credential), [google]);
  return <section className="form-page"><p className="eyebrow">Profilo e statistiche</p><h1>{profile.data?.username ?? "Salva i tuoi risultati."}</h1>
    {!profile.data && <div className="account-grid">
      <form className="panel form-stack" onSubmit={(event) => { event.preventDefault(); login.mutate(); }}><h2>Accedi</h2><label>Username<input value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="button button-primary" disabled={login.isPending}>Accedi</button></form>
      <form className="panel form-stack" onSubmit={(event) => { event.preventDefault(); register.mutate(); }}><h2>Registrati</h2><label>Username<input value={username} autoComplete="username" minLength={3} onChange={(event) => setUsername(event.target.value)} required /></label><label>Email<input type="email" value={email} autoComplete="email" onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="new-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="button button-primary" disabled={register.isPending}>Crea account e collega lo storico</button></form>
      <div className="panel form-stack"><h2>Oppure</h2><GoogleButton onCredential={googleCredential} />{google.isError && <p role="alert">Accesso Google non riuscito.</p>}</div>
    </div>}
    {stats.data && <div className="member-grid">{Object.entries(stats.data).map(([label, value]) => <div className="panel member" key={label}><strong>{label.replaceAll("_", " ")}</strong><span className="ready">{value}</span></div>)}</div>}
  </section>;
}
