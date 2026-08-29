import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { ensureGuest, joinRoom } from "./api";

export function InvitePage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem("lbc_alias") ?? "");
  const [role, setRole] = useState<"PLAYER" | "SPECTATOR">("PLAYER");
  const mutation = useMutation({ mutationFn: async () => {
    await ensureGuest();
    localStorage.setItem("lbc_alias", name);
    return joinRoom(token, name, role);
  }, onSuccess: (room) => navigate(`/rooms/${room.id}`) });
  return <section className="form-page"><p className="eyebrow">Invito privato</p><h1>Prendi posto.</h1>
    <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="panel form-stack">
      <label>Nome pubblico<input value={name} minLength={2} maxLength={32} onChange={(event) => setName(event.target.value)} required /></label>
      <fieldset><legend>Come vuoi partecipare?</legend><div className="role-grid">
        <label><input type="radio" checked={role === "PLAYER"} onChange={() => setRole("PLAYER")} /> Giocatore</label>
        <label><input type="radio" checked={role === "SPECTATOR"} onChange={() => setRole("SPECTATOR")} /> Spectator</label>
      </div></fieldset>
      {mutation.isError && <p role="alert">Non è stato possibile entrare nella stanza.</p>}
      <button className="button button-primary" disabled={mutation.isPending}>Entra nella lobby</button>
    </form>
  </section>;
}
