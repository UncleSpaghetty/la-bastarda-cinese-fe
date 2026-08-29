import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

import { getRoom, setReady } from "./api";

export function LobbyPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const room = useQuery({ queryKey: ["room", id], queryFn: () => getRoom(id), refetchInterval: 2_000 });
  const ready = useMutation({ mutationFn: (value: boolean) => setReady(id, value), onSuccess: (value) => queryClient.setQueryData(["room", id], value) });
  useEffect(() => {
    if (room.data?.status === "STARTED" && room.data.match_id) navigate(`/matches/${room.data.match_id}/setup`, { replace: true });
  }, [navigate, room.data]);
  if (room.isLoading) return <section className="form-page"><p>Caricamento lobby…</p></section>;
  if (!room.data) return <section className="form-page"><p role="alert">Lobby non disponibile.</p></section>;
  const players = room.data.members.filter((member) => member.role === "PLAYER");
  return <section className="lobby-page"><div><p className="eyebrow">Lobby privata</p><h1>La serata comincia qui.</h1>
    {room.data.countdown_deadline && <p className="countdown" role="status">Tutti pronti. La partita sta per iniziare…</p>}
    <div className="member-grid">{room.data.members.map((member) => <article className="panel member" key={member.id}>
      <div className="avatar-inline" aria-hidden="true">{member.display_name.slice(0, 2).toUpperCase()}</div>
      <div><strong>{member.display_name}</strong><p>{member.role === "PLAYER" ? "Giocatore" : "Spectator"}{member.is_host ? " · Host" : ""}</p></div>
      <span className={member.ready ? "ready" : "waiting"}>{member.ready ? "Pronto" : "In attesa"}</span>
    </article>)}</div>
    <button className="button button-primary" onClick={() => ready.mutate(true)} disabled={ready.isPending || players.length < 4}>Sono pronto</button>
    {players.length < 4 && <p className="muted">Servono almeno quattro giocatori.</p>}
  </div><aside className="panel settings"><h2>Impostazioni</h2><dl><div><dt>Preset</dt><dd>{room.data.settings.preset}</dd></div><div><dt>Turno</dt><dd>{room.data.settings.turn_seconds}s</dd></div><div><dt>Timeout</dt><dd>{room.data.settings.max_consecutive_timeouts}</dd></div></dl></aside></section>;
}
