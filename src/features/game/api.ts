import { apiRequest } from "../../lib/api/client";

export type PlayingCard = { id: string; rank: string; suit: string; position?: number };
export type PlayerView = {
  id: string; display_name: string; seat_index: number; public_face_up_cards: PlayingCard[];
  total_card_count: number; private_hand?: PlayingCard[]; own_face_down?: PlayingCard[];
};
export type MatchState = {
  match_id: string; state_version: number; deadline: string | null;
  payload: { phase: string; players: PlayerView[]; deck_count: number; table_cards: PlayingCard[] };
};

export function getMatch(id: string) { return apiRequest<MatchState>(`/matches/${id}/snapshot`); }
export function swapCards(id: string, handIds: string[], faceUpIds: string[]) {
  return apiRequest(`/matches/${id}/setup/swap`, { method: "POST", body: JSON.stringify({ hand_ids: handIds, face_up_ids: faceUpIds }) });
}
export function confirmCards(id: string) { return apiRequest(`/matches/${id}/setup/confirm`, { method: "POST", body: "{}" }); }
