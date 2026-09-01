import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { publicSiteUrl as siteUrl } from "./public-config.mjs";

const expectedAssets = [
  "favicon.ico",
  "favicon.svg",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png",
  "icons/icon-maskable-192x192.png",
  "icons/icon-maskable-512x512.png",
  "social/og-default.png",
  "social/og-square.png",
  "brand/logo-mark.svg",
  "brand/logo-horizontal.svg",
  "brand/logo-compact.svg",
  "brand/logo-monochrome.svg",
  "icons/app-icon.svg",
  "icons/app-icon-maskable.svg",
  "site.webmanifest",
  "robots.txt",
  "sitemap.xml",
];

await Promise.all(expectedAssets.map((asset) => access(resolve("dist", asset))));

function pngDimensions(buffer) {
  if (buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a") throw new Error("Invalid PNG signature");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

const dimensions = new Map([
  ["favicon-16x16.png", [16, 16]],
  ["favicon-32x32.png", [32, 32]],
  ["apple-touch-icon.png", [180, 180]],
  ["icons/icon-192x192.png", [192, 192]],
  ["icons/icon-512x512.png", [512, 512]],
  ["icons/icon-maskable-192x192.png", [192, 192]],
  ["icons/icon-maskable-512x512.png", [512, 512]],
  ["social/og-default.png", [1200, 630]],
  ["social/og-square.png", [1200, 1200]],
]);

for (const [filename, expected] of dimensions) {
  const actual = pngDimensions(await readFile(resolve("dist", filename)));
  if (actual[0] !== expected[0] || actual[1] !== expected[1]) {
    throw new Error(`[build] ${filename} is ${actual.join("x")}; expected ${expected.join("x")}.`);
  }
}

const ico = await readFile(resolve("dist/favicon.ico"));
if (ico.length < 22 || ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1 || ico.readUInt16LE(4) < 1) {
  throw new Error("[build] favicon.ico is not a valid ICO file.");
}

const manifest = JSON.parse(await readFile(resolve("dist/site.webmanifest"), "utf8"));
for (const icon of manifest.icons ?? []) await access(resolve("dist", icon.src.replace(/^\//, "")));

const index = await readFile(resolve("dist/index.html"), "utf8");
if (index.includes("%VITE_")) throw new Error("[build] Unresolved Vite placeholder in dist/index.html.");
if (!index.includes(`${siteUrl}/social/og-default.png`)) throw new Error("[build] Static Open Graph URL is missing.");

const sitemap = await readFile(resolve("dist/sitemap.xml"), "utf8");
const robots = await readFile(resolve("dist/robots.txt"), "utf8");
if (!sitemap.includes(`<loc>${siteUrl}/</loc>`)) throw new Error("[build] Sitemap canonical URL is missing.");
if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) throw new Error("[build] robots.txt sitemap URL is missing.");

console.log(`[build] SEO assets verified for ${siteUrl}.`);
