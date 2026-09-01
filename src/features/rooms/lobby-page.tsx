import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { ActionFeedback } from "../../components/feedback/action-feedback";
import { TurnTimer } from "../../components/game/turn-timer";
import { PlayerAvatar } from "../../components/game/player-avatar";
import { ApiError } from "../../lib/api/client";
import { RealtimeClient } from "../../lib/realtime/realtime-client";
import { useConnectionStore } from "../../stores/connection-store";
import { getRoom, getRoomPresets, setReady, updateRoomSettings } from "./api";
import type { RoomSettingsInput, RoomState } from "./api";
import { RoomSettingsPanel } from "./room-settings-panel";

export function LobbyPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setConnection = useConnectionStore((value) => value.setStatus);
  const [feedback, setFeedback] = useState<{ message: string; tone?: "success" | "error" }>();
  const [draft, setDraft] = useState<RoomSettingsInput>();
  const room = useQuery({ queryKey: ["room", id], queryFn: () => getRoom(id), refetchInterval: 2_000, retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2 });
  const presets = useQuery({ queryKey: ["room-presets"], queryFn: getRoomPresets, staleTime: 5 * 60_000, retry: 1 });
  const ready = useMutation({ mutationFn: (value: boolean) => setReady(id, value), onSuccess: (value) => { queryClient.setQueryData(["room", id], value); setFeedback({ message: "Sei pronto per giocare." }); }, onError: () => setFeedback({ message: "Non è stato possibile aggiornare lo stato.", tone: "error" }) });
  const saveSettings = useMutation({ mutationFn: () => updateRoomSettings(id, room.data!.settings_version, draft!), onSuccess: (value) => { queryClient.setQueryData(["room", id], value); setDraft(value.settings); setFeedback({ message: "Configurazione della stanza salvata." }); }, onError: () => setFeedback({ message: "Configurazione non salvata. Ricarica e riprova.", tone: "error" }) });
  useEffect(() => { if (!feedback) return; const timer = window.setTimeout(() => setFeedback(undefined), 3_500); return () => window.clearTimeout(timer); }, [feedback]);
  useEffect(() => { if (room.data && !draft) setDraft(room.data.settings); }, [draft, room.data]);
  useEffect(() => {
    const base = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws/v1";
    const socket = new RealtimeClient({ url: `${base}/rooms/${id}/`, onStatus: setConnection, onMessage: (message) => { if (message.type === "room.state") queryClient.setQueryData(["room", id], message.payload as RoomState); } });
    socket.connect(); return () => socket.disconnect();
  }, [id, queryClient, setConnection]);
  useEffect(() => {
    if (room.data?.status === "STARTED" && room.data.match_id) navigate(`/matches/${room.data.match_id}/setup`, { replace: true });
    if (room.error instanceof ApiError && room.error.status === 404) navigate("/", { replace: true });
  }, [navigate, room.data, room.error]);
  if (room.isLoading) return <section className="form-page"><p>Caricamento lobby…</p></section>;
  if (!room.data) return <section className="form-page"><p role="alert">Lobby non disponibile.</p></section>;
  const players = room.data.members.filter((member) => member.role === "PLAYER");
  const self = room.data.members.find((member) => member.id === room.data.self_membership_id);
  const inviteToken = sessionStorage.getItem(`lbc_invite_${id}`);
  const inviteUrl = inviteToken ? `${window.location.origin}/invite/${inviteToken}` : null;
  const copyInvite = async () => { if (!inviteUrl) return; try { await navigator.clipboard.writeText(inviteUrl); setFeedback({ message: "Link d’invito copiato." }); } catch { setFeedback({ message: "Impossibile copiare il link.", tone: "error" }); } };
  return <section className="lobby-page"><div><p className="eyebrow">Lobby privata</p><h1>La serata comincia qui.</h1>
    <ActionFeedback message={feedback?.message} tone={feedback?.tone} />
    {inviteUrl ? <div className="panel invite-panel"><div><p className="eyebrow">Invita gli amici</p><p className="muted">Condividi il collegamento privato con chi vuoi al tavolo.</p></div><button className="button button-secondary" onClick={copyInvite}>Copia link d’invito</button></div> : null}
    {room.data.countdown_deadline && <div className="countdown panel" role="status"><strong>Tutti pronti. La partita sta per iniziare…</strong><TurnTimer deadline={room.data.countdown_deadline} label="Si parte tra" compact /></div>}
    <div className="member-grid">{room.data.members.map((member) => <article className="panel member" key={member.id}><PlayerAvatar name={member.display_name} seed={member.avatar_seed} url={member.avatar_url} /><div><strong>{member.display_name}</strong><p>{member.role === "PLAYER" ? "Giocatore" : "Spectator"}{member.is_host ? " · Host" : ""}</p></div><span className={member.ready && member.connected ? "ready" : "waiting"}>{!member.connected ? "Disconnesso" : member.ready ? "Pronto" : "In attesa"}</span></article>)}</div>
    <button className="button button-primary" onClick={() => ready.mutate(true)} disabled={ready.isPending || players.length < 4}>Sono pronto</button>
    {players.length < 4 && <p className="muted">Servono almeno quattro giocatori.</p>}
  </div><aside className="settings"><div className="settings-heading"><p className="eyebrow">REGOLE DELLA SERATA</p><h2>Configura il tavolo</h2></div>{draft && self?.is_host ? <RoomSettingsPanel catalog={presets.data} isLoading={presets.isLoading} isError={presets.isError} value={draft} isSaving={saveSettings.isPending} onChange={setDraft} onSubmit={() => saveSettings.mutate()} /> : <dl className="panel"><div><dt>Preset</dt><dd>{presets.data?.presets.find((preset) => preset.code === room.data.settings.preset)?.label ?? "Configurazione personalizzata"}</dd></div><div><dt>Turno</dt><dd>{room.data.settings.turn_seconds}s</dd></div><div><dt>Timeout</dt><dd>{room.data.settings.max_consecutive_timeouts}</dd></div></dl>}</aside></section>;
}
