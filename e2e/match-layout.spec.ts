import { expect, test, type Page } from "@playwright/test";

const suits = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"];
const ranks = ["3", "4", "5", "6", "7", "8", "9", "J", "Q", "K", "2", "10", "A"];
const card = (id: string, rank: string, suit = "CLUBS") => ({ id, rank, suit });

function snapshot(id: string, count: number, { spectator = false, ace = false } = {}) {
  const localSeat = 0;
  const players = Array.from({ length: count }, (_, seat) => {
    const name = ["Giulia", "Marco", "Luca", "Sara", "Martina", "Alessandro", "Elena", "Paolo", "Chiara", "Davide"][seat];
    return {
      id: `player-${seat}`, display_name: name, avatar_seed: name, seat_index: seat, status: "ACTIVE", reentry_count: 0,
      setup_confirmed: true, total_card_count: 9 + (seat % 3),
      public_face_up_cards: [0, 1, 2].map((offset) => card(`up-${seat}-${offset}`, ranks[(seat * 2 + offset) % ranks.length], suits[(seat + offset) % suits.length])),
      ...(!spectator && seat === localSeat ? {
        hand_count: 8, face_down_count: 3,
        private_hand: ["3", "4", "5", "6", "7", "8", "9", "J"].map((rank, index) => card(`h-${index}`, rank, suits[index % suits.length])),
        own_face_down: [0, 1, 2].map((position) => ({ id: `down-${position}`, position })),
      } : {}),
    };
  });
  return {
    match_id: id, state_version: 12, deadline: new Date(Date.now() + 50_000).toISOString(),
    payload: {
      phase: ace ? "ACE_TARGET" : "TURN", players, deck_count: 31,
      table_cards: [card("t1", "5", "HEARTS"), card("t2", "6", "SPADES"), card("t3", ace ? "A" : "7", "DIAMONDS")],
      turn_seat: ace ? localSeat : 1, constraint: { rank: ace ? "A" : "7", lower_or_equal_seven: !ace },
      pending_effect: ace ? { type: "ACE_TARGET", source_player_id: "player-0" } : null,
      eligible_ace_targets: ace ? players.slice(1).map((player) => ({ id: player.id, display_name: player.display_name, total_card_count: player.total_card_count })) : [],
      recent_events: [],
    },
  };
}

async function openFixture(page: Page, id: string, count: number, options?: { spectator?: boolean; ace?: boolean }) {
  await page.route(`**/api/v1/matches/${id}/snapshot`, (route) => route.fulfill({ json: snapshot(id, count, options) }));
  await page.goto(`/matches/${id}`);
  await expect(page.locator(".game-arena")).toBeVisible();
}

async function expectNoViewportOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
}

async function expectSeatsDoNotOverlap(page: Page) {
  const boxes = await page.locator(".opponent-seat").evaluateAll((seats) => seats.map((seat) => {
    const rect = seat.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  }));
  for (let first = 0; first < boxes.length; first += 1) for (let second = first + 1; second < boxes.length; second += 1) {
    const a = boxes[first]; const b = boxes[second];
    expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).toBe(true);
  }
}

async function expectLocalCardsStayInTheirRows(page: Page) {
  const geometry = await page.locator(".local-player-dock").evaluate((dock) => {
    const rect = (element: Element) => { const value = element.getBoundingClientRect(); return { top: value.top, bottom: value.bottom, left: value.left, right: value.right }; };
    const bounds = rect(dock);
    const publicZones = rect(dock.querySelector(".local-public-zones")!);
    const fan = rect(dock.querySelector(".private-hand-fan")!);
    const actions = rect(dock.querySelector(".local-actions")!);
    const cards = [...dock.querySelectorAll(".private-hand-fan .game-card")].map(rect);
    return { bounds, publicZones, fan, actions, cards };
  });
  expect(geometry.fan.top).toBeGreaterThanOrEqual(geometry.publicZones.bottom);
  expect(Math.max(...geometry.cards.map(({ bottom }) => bottom))).toBeLessThanOrEqual(geometry.actions.top);
  expect(Math.min(...geometry.cards.map(({ left }) => left))).toBeGreaterThanOrEqual(geometry.bounds.left);
  expect(Math.max(...geometry.cards.map(({ right }) => right))).toBeLessThanOrEqual(geometry.bounds.right);
}

test("4 players at 1440×900", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page, "layout-4", 4);
  await expect(page.locator(".opponent-seat")).toHaveCount(3);
  await expect(page.locator(".local-player-dock")).toBeVisible();
  await expectNoViewportOverflow(page);
  await expectSeatsDoNotOverlap(page);
  await expectLocalCardsStayInTheirRows(page);
  const [tableBox, localBox] = await Promise.all([page.locator(".shared-game-table").boundingBox(), page.locator(".local-player-dock").boundingBox()]);
  expect(localBox!.y).toBeGreaterThan(tableBox!.y);
  await page.screenshot({ path: "test-results/match-4-players-1440x900.png", fullPage: true });
});

test("7 players at 1440×900", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page, "layout-7", 7);
  await expect(page.locator(".opponent-seat")).toHaveCount(6);
  await expectNoViewportOverflow(page);
  await expectSeatsDoNotOverlap(page);
  await page.screenshot({ path: "test-results/match-7-players-1440x900.png", fullPage: true });
});

test("10 players at 1920×1080", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openFixture(page, "layout-10", 10);
  await expect(page.locator(".game-seat-top .opponent-seat")).toHaveCount(5);
  await expect(page.locator(".game-seat-left .opponent-seat")).toHaveCount(2);
  await expect(page.locator(".game-seat-right .opponent-seat")).toHaveCount(2);
  await expectSeatsDoNotOverlap(page);
  await page.screenshot({ path: "test-results/match-10-players-1920x1080.png", fullPage: true });
});

test("mobile player at 390×844", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFixture(page, "layout-mobile", 7);
  await expect(page.locator(".game-opponents-rail")).toBeVisible();
  await expect(page.locator(".local-actions")).toBeVisible();
  await expectNoViewportOverflow(page);
  await expectLocalCardsStayInTheirRows(page);
  await page.screenshot({ path: "test-results/match-player-mobile-390x844.png", fullPage: true });
});

test("spectator desktop exposes only public seats", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page, "layout-spectator", 7, { spectator: true });
  await expect(page.locator(".spectator-banner")).toBeVisible();
  await expect(page.locator(".local-player-dock")).toHaveCount(0);
  await expect(page.getByText(/Mano|Coperte/)).toHaveCount(0);
  await page.screenshot({ path: "test-results/match-spectator-1440x900.png", fullPage: true });
});

test("ace chain desktop", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page, "layout-ace", 7, { ace: true });
  await expect(page.getByText("Asso: scegli il destinatario")).toBeVisible();
  await page.screenshot({ path: "test-results/match-ace-chain-1440x900.png", fullPage: true });
});
