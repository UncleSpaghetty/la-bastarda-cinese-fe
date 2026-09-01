import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api/client";

/** Password change and logout form for the identity settings section. */
export function useIdentityForm(onLoggedOut: () => void, onDirty: (dirty: boolean) => void) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const dirty = Boolean(current || next || confirm);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  const password = useMutation({
    mutationFn: () =>
      apiRequest("/auth/password", {
        method: "POST",
        body: JSON.stringify({ current_password: current, new_password: next }),
      }),
    onSuccess: () => {
      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage("Password aggiornata.");
      onDirty(false);
    },
  });
  const logout = useMutation({
    mutationFn: () => apiRequest("/auth/logout", { method: "POST" }),
    onSuccess: onLoggedOut,
  });
  const mismatch = confirm.length > 0 && next !== confirm;

  return {
    current,
    setCurrent,
    next,
    setNext,
    confirm,
    setConfirm,
    message,
    dirty,
    mismatch,
    password,
    logout,
  };
}
