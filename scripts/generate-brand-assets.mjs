import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fromRoot = (path) => resolve(projectRoot, path);

const browser = await chromium.launch({ headless: true });

async function renderSvg(source, destination, width, height) {
  const svg = await readFile(fromRoot(source), "utf8");
  const sourceUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><style>html,body{width:100%;height:100%;margin:0;background:transparent;overflow:hidden}img{display:block;width:100%;height:100%}</style><img alt="" src="${sourceUrl}">`);
  await page.locator("img").evaluate((image) => (image.decode ? image.decode() : Promise.resolve()));
  await page.screenshot({ path: fromRoot(destination), type: "png", omitBackground: true });
  await page.close();
  console.log(`[brand] ${destination} ${width}x${height}`);
}

await renderSvg("public/favicon.svg", "public/favicon-16x16.png", 16, 16);
await renderSvg("public/favicon.svg", "public/favicon-32x32.png", 32, 32);
await renderSvg("public/icons/app-icon.svg", "public/apple-touch-icon.png", 180, 180);
await renderSvg("public/icons/app-icon.svg", "public/icons/icon-192x192.png", 192, 192);
await renderSvg("public/icons/app-icon.svg", "public/icons/icon-512x512.png", 512, 512);
await renderSvg("public/icons/app-icon-maskable.svg", "public/icons/icon-maskable-192x192.png", 192, 192);
await renderSvg("public/icons/app-icon-maskable.svg", "public/icons/icon-maskable-512x512.png", 512, 512);
await renderSvg("public/social/og-default.svg", "public/social/og-default.png", 1200, 630);
await renderSvg("public/social/og-square.svg", "public/social/og-square.png", 1200, 1200);

await browser.close();

const faviconPng = await readFile(fromRoot("public/favicon-32x32.png"));
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader.writeUInt8(32, 6);
icoHeader.writeUInt8(32, 7);
icoHeader.writeUInt8(0, 8);
icoHeader.writeUInt8(0, 9);
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(faviconPng.length, 14);
icoHeader.writeUInt32LE(22, 18);
await writeFile(fromRoot("public/favicon.ico"), Buffer.concat([icoHeader, faviconPng]));
console.log("[brand] public/favicon.ico 32x32");
