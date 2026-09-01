import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api/client";
import type { IdentityMode, Profile } from "./use-profile-query";

/** Public profile form: username, default identity mode and avatar upload. */
export function usePublicProfileForm(
  profile: Profile,
  onSaved: () => void,
  onDirty: (dirty: boolean) => void
) {
  const [username, setUsername] = useState(profile.username);
  const [identity, setIdentity] = useState<IdentityMode>(
    profile.preferences.default_identity_mode ?? "PROFILE"
  );
  const [message, setMessage] = useState("");
  const [baseline, setBaseline] = useState({
    username: profile.username,
    identity: profile.preferences.default_identity_mode ?? "PROFILE",
  });
  const dirty = username !== baseline.username || identity !== baseline.identity;
  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  const save = useMutation({
    mutationFn: () =>
      apiRequest<Profile>("/profile", {
        method: "PATCH",
        body: JSON.stringify({ username, preferences: { default_identity_mode: identity } }),
      }),
    onSuccess: () => {
      setBaseline({ username, identity });
      setMessage("Profilo salvato.");
      onSaved();
      onDirty(false);
    },
  });
  const upload = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append("avatar", file);
      return apiRequest("/profile/avatar", { method: "POST", body });
    },
    onSuccess: () => {
      setMessage("Avatar aggiornato.");
      onSaved();
    },
  });

  return { username, setUsername, identity, setIdentity, message, dirty, save, upload };
}
