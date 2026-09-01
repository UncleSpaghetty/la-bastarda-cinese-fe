import { expect, test } from "@playwright/test";

const settings = { preset: "NORMAL", max_players: 10, turn_seconds: 75, warning_seconds: 10, max_consecutive_timeouts: 3, spectators_enabled: true, max_spectators: 20, invite_expiry_hours: 168 };
const constraints = { turn_seconds: { min: 30, max: 180, step: 5 }, warning_seconds: { min: 5, max: 30, step: 1 }, max_consecutive_timeouts: { min: 1, max: 5, step: 1 }, max_players: { min: 4, max: 10, step: 1 }, max_spectators: { min: 0, max: 100, step: 1 }, invite_expiry_hours: { min: 1, max: 720, step: 1 } };
const common = { max_players: 10, spectators_enabled: true, max_spectators: 20, invite_expiry_hours: 168 };
const presets = { default_preset_code: "NORMAL", presets: [
  { id: "fast", code: "FAST", label: "Veloce", description: "Turni corti. Esitare è già una strategia perdente.", is_custom: false, is_default: false, values: { ...common, turn_seconds: 30, warning_seconds: 10, max_consecutive_timeouts: 2 }, constraints },
  { id: "normal", code: "NORMAL", label: "Normale", description: "Il ritmo giusto per accusarsi con calma.", is_custom: false, is_default: true, values: { ...common, turn_seconds: 75, warning_seconds: 10, max_consecutive_timeouts: 3 }, constraints },
  { id: "relaxed", code: "RELAXED", label: "Rilassata", description: "Più tempo per pensare alla prossima vendetta.", is_custom: false, is_default: false, values: { ...common, turn_seconds: 120, warning_seconds: 10, max_consecutive_timeouts: 5 }, constraints },
  { id: "custom", code: "CUSTOM", label: "Personalizzata", description: "Decidi tu il ritmo. Poi non dare la colpa al timer.", is_custom: true, is_default: false, values: { ...common, turn_seconds: 75, warning_seconds: 10, max_consecutive_timeouts: 3 }, constraints },
] };
const dashboard = { identity: "ACCOUNT", persistent: true, kpis: [
  { key: "matches.played", value: 18, change: null }, { key: "matches.finished", value: 11, change: null }, { key: "matches.lost", value: 3, change: null }, { key: "player.retired", value: 2, change: null }, { key: "ace.reentered", value: 4, change: null }, { key: "turn.timeout", value: 7, change: null },
], outcomes: [{ key: "FINISHED", value: 11 }, { key: "LOSER", value: 3 }, { key: "RETIRED", value: 2 }, { key: "ABANDONED", value: 2 }], timeline: [
  { period: "2026-07-27", played: 3, finished: 2, lost: 1 }, { period: "2026-08-03", played: 5, finished: 3, lost: 1 }, { period: "2026-08-10", played: 4, finished: 3, lost: 0 }, { period: "2026-08-17", played: 6, finished: 3, lost: 1 },
], actions: [{ key: "cards.played", value: 146 }, { key: "table.collected", value: 12 }, { key: "cards.banished", value: 51 }, { key: "ace.played", value: 19 }, { key: "player.skipped", value: 17 }, { key: "turn.timeout", value: 7 }], matches: [
  { id: "11111111-1111-1111-1111-111111111111", date: "2026-08-30T20:10:00Z", duration_seconds: 2280, player_count: 6, preset: "NORMAL", outcome: "FINISHED", cards_played: 18, tables_collected: 1, timeouts: 0, replay_available: true },
  { id: "22222222-2222-2222-2222-222222222222", date: "2026-08-27T20:10:00Z", duration_seconds: 3120, player_count: 8, preset: "RELAXED", outcome: "LOSER", cards_played: 21, tables_collected: 3, timeouts: 1, replay_available: true },
], total_matches: 18, available_filters: { presets: ["NORMAL", "RELAXED"], player_counts: [6, 8], outcomes: ["FINISHED", "LOSER"] } };

test("captures the second UX intervention", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Screenshot matrix is captured once with explicit viewports.");
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto("/"); await expect(page.getByRole("heading", { name: /liberati delle carte/i })).toBeVisible(); await page.screenshot({ path: "screenshots/homepage-desktop-1440x900.png" });
  await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: "screenshots/homepage-mobile-390x844.png" });

  await page.route("**/api/v1/rooms/11111111-1111-1111-1111-111111111111", (route) => route.fulfill({ json: { id: "11111111-1111-1111-1111-111111111111", status: "LOBBY", match_id: null, self_membership_id: "host", settings_version: 1, countdown_deadline: null, settings, members: [{ id: "host", display_name: "Alessio", avatar_seed: "a", role: "PLAYER", ready: false, connected: true, is_host: true }, { id: "friend", display_name: "Martina", avatar_seed: "b", role: "PLAYER", ready: false, connected: true, is_host: false }] } }));
  await page.route("**/api/v1/platform-config/room-presets", (route) => route.fulfill({ json: presets }));
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto("/rooms/11111111-1111-1111-1111-111111111111"); await expect(page.getByRole("radio", { name: /normale/i })).toBeVisible(); await page.screenshot({ path: "screenshots/lobby-normal.png", fullPage: true });
  await page.getByRole("radio", { name: /personalizzata/i }).click(); await expect(page.getByRole("heading", { name: /personalizza il tavolo/i })).toBeVisible(); await page.waitForTimeout(450); await page.screenshot({ path: "screenshots/lobby-custom-expanded.png", fullPage: true });

  await page.route("**/api/v1/me/history-dashboard?*", (route) => route.fulfill({ json: dashboard })); await page.goto("/history?range=20"); await expect(page.getByRole("heading", { name: /fedina penale/i })).toBeVisible(); await page.screenshot({ path: "screenshots/history-with-data.png", fullPage: true });
  await page.unroute("**/api/v1/me/history-dashboard?*"); await page.route("**/api/v1/me/history-dashboard?*", (route) => route.fulfill({ json: { ...dashboard, kpis: [], outcomes: [], timeline: [], actions: [], matches: [], total_matches: 0, available_filters: { presets: [], player_counts: [], outcomes: [] } } })); await page.reload(); await expect(page.getByText(/non hai ancora perso abbastanza/i)).toBeVisible(); await page.screenshot({ path: "screenshots/history-empty.png", fullPage: true });

  await page.route("**/api/v1/profile", (route) => route.fulfill({ json: { id: 1, username: "alessio", email: "alessio@example.com", email_verified: false, avatar_url: "", preferences: { default_identity_mode: "PROFILE", effects_volume: 70 }, oauth_providers: ["GOOGLE"] } }));
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto("/profile"); await expect(page.getByRole("heading", { name: /profilo pubblico/i })).toBeVisible(); await page.screenshot({ path: "screenshots/account-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: "screenshots/account-mobile.png", fullPage: true });
});
