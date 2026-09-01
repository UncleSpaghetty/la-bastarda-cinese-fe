import { apiRequest } from "@/lib/api/client";

export type StatisticKey =
  | "matches.played" | "matches.finished" | "matches.lost" | "matches.abandoned"
  | "cards.played" | "table.collected" | "cards.banished" | "ace.played" | "ace.reentered"
  | "player.retired" | "player.skipped" | "turn.timeout";

export const STAT_LABELS: Record<StatisticKey, string> = {
  "cards.played": "Carte giocate", "matches.played": "Partite giocate",
  "matches.finished": "Uscite regolari", "matches.lost": "Ultimi posti",
  "matches.abandoned": "Partite abbandonate", "table.collected": "Tavoli raccolti",
  "cards.banished": "Carte bandite", "ace.played": "Assi giocati",
  "ace.reentered": "Rientri con asso", "player.retired": "Ritiri",
  "player.skipped": "Giocatori saltati con un 8", "turn.timeout": "Timeout",
};

export function statisticLabel(key: string): string {
  if (key in STAT_LABELS) return STAT_LABELS[key as StatisticKey];
  console.warn("Unknown statistic key received", { key });
  return "Statistica non disponibile";
}

export const OUTCOME_LABELS = {
  FINISHED: "Salvo", LOSER: "Ultimo rimasto", RETIRED: "Ritirato", ABANDONED: "Partita abbandonata",
} as const;
export type Outcome = keyof typeof OUTCOME_LABELS;

export type HistoryDashboard = {
  identity: "ACCOUNT" | "GUEST" | "ANONYMOUS";
  persistent: boolean;
  kpis: { key: string; value: number; change: number | null }[];
  outcomes: { key: Outcome; value: number }[];
  timeline: { period: string; played: number; finished: number; lost: number }[];
  actions: { key: string; value: number }[];
  matches: { id: string; date: string; duration_seconds: number; player_count: number; preset: string; outcome: Outcome; cards_played: number; tables_collected: number; timeouts: number; replay_available: boolean }[];
  total_matches: number;
  available_filters: { presets: string[]; player_counts: number[]; outcomes: Outcome[] };
};

export function getHistoryDashboard(params: URLSearchParams) {
  return apiRequest<HistoryDashboard>(`/me/history-dashboard?${params.toString()}`);
}
