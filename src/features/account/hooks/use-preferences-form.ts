import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api/client";
import type { Profile } from "./use-profile-query";

/** Preference toggles (collect confirmation, motion, history, spectator, volume). */
export function usePreferencesForm(
  profile: Profile,
  onSaved: () => void,
  onDirty: (dirty: boolean) => void
) {
  const initial = {
    confirm_collect: profile.preferences.confirm_collect ?? true,
    effects_volume: profile.preferences.effects_volume ?? 70,
    reduce_motion: profile.preferences.reduce_motion ?? false,
    auto_open_history: profile.preferences.auto_open_history ?? false,
    spectator_enabled: profile.preferences.spectator_enabled ?? true,
  };
  const [values, setValues] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [message, setMessage] = useState("");
  const dirty = JSON.stringify(values) !== JSON.stringify(baseline);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  const save = useMutation({
    mutationFn: () =>
      apiRequest("/profile", { method: "PATCH", body: JSON.stringify({ preferences: values }) }),
    onSuccess: () => {
      setBaseline(values);
      setMessage("Preferenze salvate.");
      onSaved();
      onDirty(false);
    },
  });

  return { values, setValues, message, dirty, save };
}
