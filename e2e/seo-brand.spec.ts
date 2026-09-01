import { expect, test } from "@playwright/test";

test("SPA metadata stays unique, private, and reversible", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The head behaves identically in both browser projects.");
  await page.goto("/");
  await expect(page).toHaveTitle("La bastarda cinese | Gioco di carte multiplayer online");
  await expect(page.locator('head meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('head meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('head meta[property="og:image"]')).toHaveCount(1);

  await page.getByRole("link", { name: "Storico" }).click();
  await expect(page).toHaveTitle("Storico e statistiche | La bastarda cinese");
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveTitle("La bastarda cinese | Gioco di carte multiplayer online");
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('head meta[property="og:image"]')).toHaveCount(1);

  await page.goto("/invite/token-che-non-deve-apparire?username=privato#mano");
  await expect(page).toHaveTitle("Sei stato invitato | La bastarda cinese");
  expect(await page.locator("head").innerHTML()).not.toContain("token-che-non-deve-apparire");
  expect(await page.locator("head").innerHTML()).not.toContain("username=privato");

  await page.goto("/pagina-inesistente");
  await expect(page).toHaveTitle("Questa carta non esiste | La bastarda cinese");
  await expect(page.getByRole("heading", { name: "Questa carta non esiste." })).toBeVisible();
  await expect(page.getByRole("link", { name: /torna alla homepage/i })).toBeVisible();
});

test("produces the brand asset preview matrix", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The preview matrix is captured once.");
  await page.goto("/");
  const origin = new URL(page.url()).origin;
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.setContent(`<!doctype html><html><head><style>
    *{box-sizing:border-box} body{margin:0;padding:36px;background:#d8d8e4;color:#07142f;font-family:Inter,system-ui,sans-serif}
    h1{margin:0 0 24px;font-size:28px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.tile{min-height:300px;display:grid;place-items:center;border-radius:28px;box-shadow:0 16px 44px #07142f25}.light{background:#f8f4ec}.dark{background:#07142f}.tile img{width:180px;height:180px}.label{position:absolute;margin-top:240px;font-weight:800}.dark .label{color:#f8f4ec}
  </style></head><body><h1>La carta bastarda — contrasto del marchio</h1><div class="grid"><div class="tile light"><img src="${origin}/brand/logo-mark.svg" width="180" height="180" alt=""><span class="label">Sfondo chiaro</span></div><div class="tile dark"><img src="${origin}/brand/logo-mark.svg" width="180" height="180" alt=""><span class="label">Sfondo scuro</span></div></div></body></html>`);
  await expect.poll(() => page.locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: "screenshots/brand/brand-mark-light-dark.png", fullPage: true });

  await page.setContent(`<!doctype html><html><head><style>
    *{box-sizing:border-box}body{margin:0;padding:42px;background:#07142f;color:#f8f4ec;font-family:Inter,system-ui,sans-serif}h1{margin:0 0 36px}.row{display:flex;align-items:end;gap:48px}.sample{display:grid;justify-items:center;gap:16px;padding:24px;border:1px solid #ffffff22;border-radius:20px;background:#ffffff08}.checker{display:grid;place-items:center;background:repeating-conic-gradient(#f8f4ec 0 25%,#d8d8e4 0 50%) 50%/14px 14px}.px16{width:48px;height:48px}.px16 img{width:16px;height:16px}.px32{width:64px;height:64px}.px32 img{width:32px;height:32px}.large img{width:180px;height:180px}.mask{border-radius:38px;overflow:hidden}
  </style></head><body><h1>Icone di prodotto — dimensioni reali e installazione</h1><div class="row"><div class="sample"><div class="checker px16"><img src="${origin}/favicon-16x16.png" width="16" height="16"></div><b>Favicon 16×16</b></div><div class="sample"><div class="checker px32"><img src="${origin}/favicon-32x32.png" width="32" height="32"></div><b>Favicon 32×32</b></div><div class="sample large"><img src="${origin}/apple-touch-icon.png" width="180" height="180"><b>Apple Touch Icon</b></div><div class="sample large"><img class="mask" src="${origin}/icons/icon-maskable-192x192.png" width="180" height="180"><b>Maskable 192×192</b></div></div></body></html>`);
  await expect.poll(() => page.locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: "screenshots/brand/brand-icons-preview.png", fullPage: true });

  await page.setContent(`<!doctype html><html><head><style>
    body{margin:0;min-height:500px;display:grid;place-items:center;background:#07142f;font-family:Inter,system-ui,sans-serif}.frame{width:900px;padding:64px;border:1px solid #ffffff22;border-radius:28px;background:#111837;box-shadow:0 20px 60px #02071966}.frame img{display:block;width:100%;height:auto}
  </style></head><body><div class="frame"><img src="${origin}/brand/logo-horizontal.svg" width="720" height="160" alt="Logo orizzontale La bastarda cinese"></div></body></html>`);
  await expect.poll(() => page.locator("img").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({ path: "screenshots/brand/logo-horizontal-preview.png", fullPage: true });

  await page.setViewportSize({ width: 1600, height: 1050 });
  await page.setContent(`<!doctype html><html><head><style>
    *{box-sizing:border-box}body{margin:0;padding:34px;background:#d9dbe6;color:#07142f;font-family:Inter,system-ui,sans-serif}h1{margin:0 0 22px}.board{display:grid;grid-template-columns:620px 1fr;gap:22px}.panel{border-radius:26px;background:#07142f;color:#f8f4ec;box-shadow:0 14px 42px #07142f24}.hero{height:820px;display:grid;place-items:center;align-content:center;gap:18px}.hero img{width:512px;height:512px}.right{display:grid;grid-template-rows:auto auto 1fr;gap:22px}.sizes,.favicons,.contrast{display:flex;align-items:center;justify-content:space-around;gap:20px;padding:28px}.sample{display:grid;justify-items:center;align-content:center;gap:14px}.sample b{font-size:18px}.mark128{width:128px;height:128px}.mark64{width:64px;height:64px}.pixelbox{width:88px;height:88px;display:grid;place-items:center;background:repeating-conic-gradient(#fff 0 25%,#d9dbe6 0 50%) 50%/16px 16px;border-radius:16px}.fav32{width:32px;height:32px}.fav16{width:16px;height:16px}.contrast{padding:0;background:transparent;box-shadow:none}.contrast .sample{width:50%;height:100%;min-height:270px;border-radius:26px}.on-light{background:#f8f4ec;color:#07142f}.on-dark{background:#07142f;color:#f8f4ec}.contrast img{width:160px;height:160px}
  </style></head><body><h1>La carta bastarda — tavola di controllo</h1><div class="board"><section class="panel hero"><img src="${origin}/brand/logo-mark.svg" width="512" height="512"><b>Marchio completo · 512 px</b></section><div class="right"><section class="panel sizes"><div class="sample"><img class="mark128" src="${origin}/brand/logo-mark.svg"><b>128 px</b></div><div class="sample"><img class="mark64" src="${origin}/brand/logo-mark.svg"><b>64 px</b></div></section><section class="panel favicons"><div class="sample"><div class="pixelbox"><img class="fav32" src="${origin}/favicon-32x32.png"></div><b>Favicon 32 px</b></div><div class="sample"><div class="pixelbox"><img class="fav16" src="${origin}/favicon-16x16.png"></div><b>Favicon 16 px</b></div></section><section class="contrast"><div class="sample on-light"><img src="${origin}/brand/logo-mark.svg"><b>Fondo chiaro</b></div><div class="sample on-dark"><img src="${origin}/brand/logo-mark.svg"><b>Fondo scuro</b></div></section></div></div></body></html>`);
  await expect.poll(() => page.locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: "screenshots/brand/brand-control-board.png", fullPage: true });

  await page.setViewportSize({ width: 1400, height: 720 });
  await page.setContent(`<!doctype html><html><head><style>
    *{box-sizing:border-box}body{margin:0;padding:38px;background:#d9dbe6;color:#07142f;font-family:Inter,system-ui,sans-serif}h1{margin:0 0 28px}.row{display:flex;justify-content:center;gap:42px}.sample{display:grid;justify-items:center;gap:16px;font-size:18px;font-weight:800}.icon{position:relative;width:320px;height:320px;background:#07142f;overflow:hidden}.icon img{width:100%;height:100%}.safe::after{content:"";position:absolute;inset:10%;border:3px dashed #f8f4ec;border-radius:50%;box-shadow:0 0 0 999px #ff5c5c18}.circle{border-radius:50%}.squircle{border-radius:28%}
  </style></head><body><h1>Icona maskable — safe area e ritagli di sistema</h1><div class="row"><div class="sample"><div class="icon safe"><img src="${origin}/icons/icon-maskable-512x512.png"></div><span>Safe area centrale</span></div><div class="sample"><div class="icon circle"><img src="${origin}/icons/icon-maskable-512x512.png"></div><span>Ritaglio circolare</span></div><div class="sample"><div class="icon squircle"><img src="${origin}/icons/icon-maskable-512x512.png"></div><span>Ritaglio squircle</span></div></div></body></html>`);
  await expect.poll(() => page.locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: "screenshots/brand/brand-maskable-safe-area.png", fullPage: true });
});
