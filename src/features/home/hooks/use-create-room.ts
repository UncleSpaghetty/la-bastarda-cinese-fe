import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";

import { apiRequest } from "@/lib/api/client";
import { createRoom, ensureGuest } from "@/features/rooms/api";

type ModalStep = "choice" | "login" | "register" | "alias";

/** Creates the room and redirects, after either an authenticated session or an alias was chosen. */
function useRoomLaunch() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (input: { displayName: string; identityMode: "ALIAS" | "PROFILE" }) => {
      if (input.identityMode === "ALIAS") {
        await ensureGuest();
        localStorage.setItem("lbc_alias", input.displayName);
      }
      return createRoom(input.displayName, input.identityMode);
    },
    onSuccess: (room) => {
      if (room.invite_token) sessionStorage.setItem(`lbc_invite_${room.id}`, room.invite_token);
      navigate(`/rooms/${room.id}`);
    },
  });
}

/**
 * Nudges players to authenticate before creating a room, so the match can be linked to their
 * history. Offers login, registration or a one-off alias, all leading to the same room launch.
 */
export function useStartRoomModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ModalStep>("choice");
  const [alias, setAlias] = useState(() => localStorage.getItem("lbc_alias") ?? "");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const launch = useRoomLaunch();
  const login = useMutation({
    mutationFn: () =>
      apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
    onSuccess: () => launch.mutate({ displayName: username, identityMode: "PROFILE" }),
  });
  const register = useMutation({
    mutationFn: () =>
      apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      }),
    onSuccess: () => launch.mutate({ displayName: username, identityMode: "PROFILE" }),
  });

  const openModal = () => {
    setStep("choice");
    setOpen(true);
  };
  const closeModal = () => setOpen(false);
  const enterInvite = () => {
    const token = window.prompt("Incolla il codice o il token di invito");
    if (token?.trim()) navigate(`/invite/${token.trim()}`);
  };
  const submitAlias = () => launch.mutate({ displayName: alias.trim(), identityMode: "ALIAS" });

  return {
    open,
    step,
    setStep,
    alias,
    setAlias,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    login,
    register,
    launch,
    openModal,
    closeModal,
    enterInvite,
    submitAlias,
  };
}
