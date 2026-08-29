import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { apiRequest } from "../../lib/api/client";

export function ProfilePage() {
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => apiRequest<{ username: string }>("/profile"), retry: false });
  const stats = useQuery({ queryKey: ["statistics"], queryFn: () => apiRequest<Record<string, number>>("/statistics") });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const register = useMutation({ mutationFn: () => apiRequest("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }), onSuccess: () => profile.refetch() });
  return <section className="form-page"><p className="eyebrow">Profilo e statistiche</p><h1>{profile.data?.username ?? "Salva i tuoi risultati."}</h1>
    {!profile.data && <form className="panel form-stack" onSubmit={(event) => { event.preventDefault(); register.mutate(); }}><label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>Password<input type="password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button button-primary">Crea account e collega lo storico</button></form>}
    {stats.data && <div className="member-grid">{Object.entries(stats.data).map(([label, value]) => <div className="panel member" key={label}><strong>{label.replaceAll("_", " ")}</strong><span className="ready">{value}</span></div>)}</div>}
  </section>;
}
