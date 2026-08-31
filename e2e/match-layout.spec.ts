import { expect, test } from "@playwright/test";

const suits = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"];
const ranks = ["3", "4", "5", "6", "7", "8", "9", "J", "Q", "K", "2", "10", "A"];
const card = (id: string, rank: string, suit = "CLUBS") => ({ id, rank, suit });
const players = ["Giulia", "Marco", "Luca", "Sara", "Martina", "Alessandro"].map((name, seat) => ({
  id: `player-${seat}`,
  display_name: name,
  avatar_seed: name,
  seat_index: seat,
  status: "ACTIVE",
  reentry_count: 0,
  setup_confirmed: true,
  total_card_count: 9 + seat,
  hand_count: seat === 2 ? 7 : 6 + (seat % 3),
  face_down_count: 3,
  public_face_up_cards: [0, 1, 2].map((offset) => card(`up-${seat}-${offset}`, ranks[(seat * 2 + offset) % ranks.length], suits[(seat + offset) % suits.length])),
  ...(seat === 2 ? {
    private_hand: [card("h1", "3"), card("h2", "4", "DIAMONDS"), card("h3", "5", "HEARTS"), card("h4", "6", "SPADES"), card("h5", "7", "DIAMONDS"), card("h6", "8"), card("h7", "9", "HEARTS"), card("h8", "J", "SPADES"), card("h9", "Q", "HEARTS"), card("h10", "K", "DIAMONDS"), card("h11", "2"), card("h12", "A", "SPADES")],
    own_face_down: [0, 1, 2].map((index) => ({ id: `down-${index}`, position: index })),
  } : {}),
}));

const snapshot = {
  match_id: "layout-preview",
  state_version: 12,
  deadline: new Date(Date.now() + 50_000).toISOString(),
  payload: {
    phase: "TURN",
    players,
    deck_count: 31,
    table_cards: [card("t1", "5", "HEARTS"), card("t2", "6", "SPADES"), card("t3", "7", "DIAMONDS")],
    turn_seat: 0,
    constraint: { rank: "7", lower_or_equal_seven: true },
    pending_effect: null,
    eligible_ace_targets: [],
    recent_events: [],
  },
};

test("match table remains spaced at representative viewport sizes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desktop project already exercises every target viewport.");
  await page.route("**/api/v1/matches/layout-preview/snapshot", (route) => route.fulfill({ json: snapshot }));

  for (const viewport of [
    { name: "wide", width: 1600, height: 1000 },
    { name: "laptop", width: 1280, height: 800 },
    { name: "tablet", width: 900, height: 1100 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/matches/layout-preview");
    await expect(page.locator(".table-arena")).toBeVisible();
    await expect(page.locator(".current-seat")).toBeVisible();
    await page.screenshot({ path: `test-results/match-layout-${viewport.name}.png`, fullPage: true });
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(hasHorizontalOverflow, `${viewport.name} must not overflow horizontally`).toBe(false);
  }
});
