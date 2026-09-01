import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { ApiError } from "@/lib/api/client";
import { RealtimeClient } from "@/lib/realtime/realtime-client";
import { useConnectionStore } from "@/stores/connection-store";

import { getRoom, getRoomPresets, setReady, updateRoomSettings } from "../api";
import type { RoomSettingsInput, RoomState } from "../api";

/** All state, effects and command handlers powering the room lobby page. */
export function useLobby() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setConnection = useConnectionStore((value) => value.setStatus);
  const [feedback, setFeedback] = useState<{ message: string; tone?: "success" | "error" }>();
  const [draft, setDraft] = useState<RoomSettingsInput>();

  const room = useQuery({
    queryKey: ["room", id],
    queryFn: () => getRoom(id),
    refetchInterval: 2_000,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
  const presets = useQuery({
    queryKey: ["room-presets"],
    queryFn: getRoomPresets,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const ready = useMutation({
    mutationFn: (value: boolean) => setReady(id, value),
    onSuccess: (value) => {
      queryClient.setQueryData(["room", id], value);
      setFeedback({ message: "Sei pronto per giocare." });
    },
    onError: () =>
      setFeedback({ message: "Non è stato possibile aggiornare lo stato.", tone: "error" }),
  });
  const saveSettings = useMutation({
    mutationFn: () => updateRoomSettings(id, room.data!.settings_version, draft!),
    onSuccess: (value) => {
      queryClient.setQueryData(["room", id], value);
      setDraft(value.settings);
      setFeedback({ message: "Configurazione della stanza salvata." });
    },
    onError: () =>
      setFeedback({ message: "Configurazione non salvata. Ricarica e riprova.", tone: "error" }),
  });

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(undefined), 3_500);
    return () => window.clearTimeout(timer);
  }, [feedback]);
  useEffect(() => {
    if (room.data && !draft) setDraft(room.data.settings);
  }, [draft, room.data]);
  useEffect(() => {
    const base = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws/v1";
    const socket = new RealtimeClient({
      url: `${base}/rooms/${id}/`,
      onStatus: setConnection,
      onMessage: (message) => {
        if (message.type === "room.state")
          queryClient.setQueryData(["room", id], message.payload as RoomState);
      },
    });
    socket.connect();
    return () => socket.disconnect();
  }, [id, queryClient, setConnection]);
  useEffect(() => {
    if (room.data?.status === "STARTED" && room.data.match_id)
      navigate(`/matches/${room.data.match_id}/setup`, { replace: true });
    if (room.error instanceof ApiError && room.error.status === 404)
      navigate("/", { replace: true });
  }, [navigate, room.data, room.error]);

  const players = room.data?.members.filter((member) => member.role === "PLAYER") ?? [];
  const self = room.data?.members.find((member) => member.id === room.data.self_membership_id);
  const inviteToken = sessionStorage.getItem(`lbc_invite_${id}`);
  const inviteUrl = inviteToken ? `${window.location.origin}/invite/${inviteToken}` : null;
  const copyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setFeedback({ message: "Link d'invito copiato." });
    } catch {
      setFeedback({ message: "Impossibile copiare il link.", tone: "error" });
    }
  };

  return {
    room,
    presets,
    feedback,
    draft,
    setDraft,
    players,
    self,
    inviteUrl,
    copyInvite,
    ready: (value: boolean) => ready.mutate(value),
    readyPending: ready.isPending,
    saveSettings: () => saveSettings.mutate(),
    savePending: saveSettings.isPending,
  };
}
