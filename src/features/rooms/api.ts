import { apiRequest } from "../../lib/api/client";

export type RoomState = {
  id: string;
  status: "LOBBY" | "STARTED" | "CLOSED";
  match_id: string | null;
  self_membership_id: string | null;
  settings_version: number;
  countdown_deadline: string | null;
  settings: {
    preset: string;
    max_players: number;
    turn_seconds: number;
    warning_seconds: number;
    max_consecutive_timeouts: number;
    spectators_enabled: boolean;
    max_spectators: number;
    invite_expiry_hours: number;
  };
  members: {
    id: string;
    display_name: string;
    avatar_seed: string;
    avatar_url?: string;
    role: "PLAYER" | "SPECTATOR";
    ready: boolean;
    connected: boolean;
    is_host: boolean;
  }[];
  invite_token?: string;
};

export async function ensureGuest() {
  return apiRequest<{ id: string }>("/guest-identities", { method: "POST" });
}

export function createRoom(displayName: string) {
  return apiRequest<RoomState>("/rooms", {
    method: "POST",
    body: JSON.stringify({ identity_mode: "ALIAS", display_name: displayName }),
  });
}

export function joinRoom(token: string, displayName: string, role: "PLAYER" | "SPECTATOR") {
  return apiRequest<RoomState>(`/invites/${token}/join`, {
    method: "POST",
    body: JSON.stringify({ identity_mode: "ALIAS", display_name: displayName, role }),
  });
}

export function getRoom(id: string) {
  return apiRequest<RoomState>(`/rooms/${id}`);
}
export function setReady(id: string, ready: boolean) {
  return apiRequest<RoomState>(`/rooms/${id}/membership`, {
    method: "PATCH",
    body: JSON.stringify({ ready }),
  });
}
export type RoomSettingsInput = RoomState["settings"];
export type NumericConstraint = { min: number; max: number; step: number };
export type RoomPreset = {
  id: string;
  code: string;
  label: string;
  description: string;
  is_custom: boolean;
  is_default: boolean;
  values: Omit<RoomSettingsInput, "preset">;
  constraints: Partial<
    Record<keyof Omit<RoomSettingsInput, "preset" | "spectators_enabled">, NumericConstraint>
  >;
};
export type RoomPresetResponse = { default_preset_code: string; presets: RoomPreset[] };
export function getRoomPresets() {
  return apiRequest<RoomPresetResponse>("/platform-config/room-presets");
}
export function updateRoomSettings(
  id: string,
  expectedVersion: number,
  settings: RoomSettingsInput
) {
  return apiRequest<RoomState>(`/rooms/${id}/settings`, {
    method: "PATCH",
    body: JSON.stringify({ expected_version: expectedVersion, ...settings }),
  });
}
