import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";

export type IdentityMode = "PROFILE" | "ALIAS" | "ANONYMOUS";
export type Preferences = {
  default_identity_mode?: IdentityMode;
  confirm_collect?: boolean;
  effects_volume?: number;
  reduce_motion?: boolean;
  auto_open_history?: boolean;
  spectator_enabled?: boolean;
};
export type Profile = {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  avatar_url: string;
  preferences: Preferences;
  oauth_providers: string[];
};

/** Fetches the current profile and exposes a refresh helper for auth/save flows. */
export function useProfileQuery() {
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiRequest<Profile>("/profile"),
    retry: false,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["profile"] });
  return { profile, refresh };
}

/** Login, registration and Google auth mutations for the auth gateway panel. */
export function useAuthGateway(onSuccess: () => void) {
  const login = useMutation({
    mutationFn: (input: { username: string; password: string }) =>
      apiRequest("/auth/login", { method: "POST", body: JSON.stringify(input) }),
    onSuccess,
  });
  const register = useMutation({
    mutationFn: (input: { username: string; email: string; password: string }) =>
      apiRequest("/auth/register", { method: "POST", body: JSON.stringify(input) }),
    onSuccess,
  });
  const google = useMutation({
    mutationFn: (credential: string) =>
      apiRequest("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),
    onSuccess,
  });
  return { login, register, google };
}
