import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";

import { createRoom, ensureGuest } from "@/features/rooms/api";

/** State and handlers powering the room creation form on the homepage. */
export function useCreateRoom() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState(() => localStorage.getItem("lbc_alias") ?? "");
  const mutation = useMutation({
    mutationFn: async () => {
      await ensureGuest();
      const displayName = hostName.trim();
      localStorage.setItem("lbc_alias", displayName);
      return createRoom(displayName);
    },
    onSuccess: (room) => {
      if (room.invite_token) sessionStorage.setItem(`lbc_invite_${room.id}`, room.invite_token);
      navigate(`/rooms/${room.id}`);
    },
  });
  const enterInvite = () => {
    const token = window.prompt("Incolla il codice o il token di invito");
    if (token?.trim()) navigate(`/invite/${token.trim()}`);
  };

  return {
    hostName,
    setHostName,
    isPending: mutation.isPending,
    submit: () => mutation.mutate(),
    enterInvite,
  };
}
