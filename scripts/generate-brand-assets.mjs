import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { optimize } from "svgo";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fromRoot = (path) => resolve(projectRoot, path);
const sourceOriginal = "public/brand/source-logo.original.svg";
const sourceOptimized = "public/brand/source-logo.svg";
const markViewBox = "256 224 512 576";

const original = await readFile(fromRoot(sourceOriginal), "utf8");
if (/<image\b|(?:href|xlink:href)=["']data:image\//i.test(original)) {
  throw new Error("[brand] The approved source must be vector-only; an embedded raster image was found.");
}
const optimized = optimize(original, {
  path: sourceOriginal,
  floatPrecision: 8,
  multipass: true,
  // Deliberately omit geometry and colour conversion plugins: the approved
  // paths must remain byte-for-byte equivalent in their rendered result.
  plugins: [
    "removeXMLProcInst",
    "removeMetadata",
    "removeEditorsNSData",
    "removeDimensions",
    "removeUselessDefs",
    "removeEmptyContainers",
    "cleanupIds",
    "sortAttrs",
  ],
}).data;
const svgBody = optimized.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/i)?.[1];
if (!svgBody) throw new Error("[brand] SVGO did not return a valid SVG document.");
const svg = (viewBox, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>\n`;
const approvedMark = svg(markViewBox, svgBody);
const monochromeBody = svgBody.replace(/fill="(?:#[0-9a-f]{3,8}|[a-z]+)"/gi, 'fill="#080A34"').replace(/\sfill-opacity="[^"]+"/gi, "");

await writeFile(fromRoot(sourceOptimized), optimized + "\n");
await Promise.all([
  writeFile(fromRoot("public/brand/logo-mark.svg"), approvedMark),
  writeFile(fromRoot("public/brand/logo-horizontal.svg"), approvedMark),
  writeFile(fromRoot("public/brand/logo-compact.svg"), approvedMark),
  writeFile(fromRoot("public/brand/logo-monochrome.svg"), svg(markViewBox, monochromeBody)),
]);

// Favicon mirrors the app-icon layout: dark rounded background with the full mark embedded,
// so the browser tab icon is visually consistent with the home screen icon.
await writeFile(fromRoot("public/favicon.svg"), svg("0 0 32 32", `<rect width="32" height="32" rx="7" fill="#080A34"/><svg x="3" y="3" width="26" height="26" viewBox="${markViewBox}">${svgBody}</svg>`));

const appIcon = (maskable) => {
  const inset = maskable ? 102 : 54;
  const size = 512 - inset * 2;
  return svg("0 0 512 512", `<rect width="512" height="512"${maskable ? "" : ' rx="104"'} fill="#080A34"/><svg x="${inset}" y="${inset}" width="${size}" height="${size}" viewBox="${markViewBox}">${svgBody}</svg>`);
};
await writeFile(fromRoot("public/icons/app-icon.svg"), appIcon(false));
await writeFile(fromRoot("public/icons/app-icon-maskable.svg"), appIcon(true));

const socialMark = (x, y, size) => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${markViewBox}">${svgBody}</svg>`;
await writeFile(fromRoot("public/social/og-default.svg"), svg("0 0 1200 630", `<rect width="1200" height="630" fill="#080A34"/>${socialMark(48, 55, 520)}<text x="555" y="285" fill="#DCD6C7" font-family="Outfit,system-ui,sans-serif" font-size="68" font-weight="800">La bastarda</text><text x="555" y="360" fill="#DCD6C7" font-family="Outfit,system-ui,sans-serif" font-size="68" font-weight="800">cinese</text>`));
await writeFile(fromRoot("public/social/og-square.svg"), svg("0 0 1200 1200", `<rect width="1200" height="1200" fill="#080A34"/>${socialMark(220, 110, 760)}<text x="600" y="975" text-anchor="middle" fill="#DCD6C7" font-family="Outfit,system-ui,sans-serif" font-size="78" font-weight="800">La bastarda cinese</text>`));

const browser = await chromium.launch({ headless: true });
async function renderForComparison(sourceText) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  const sourceUrl = `data:image/svg+xml;base64,${Buffer.from(sourceText).toString("base64")}`;
  await page.setContent(`<style>html,body{margin:0;background:transparent}img{display:block;width:1024px;height:1024px}</style><img src="${sourceUrl}">`);
  await page.locator("img").evaluate((image) => image.decode?.());
  const screenshot = await page.screenshot({ omitBackground: true });
  await page.close();
  return screenshot;
}
const [originalRendering, optimizedRendering] = await Promise.all([
  renderForComparison(original),
  renderForComparison(optimized),
]);
if (!originalRendering.equals(optimizedRendering)) {
  await browser.close();
  throw new Error("[brand] SVGO changed the rendered pixels of the approved source.");
}
console.log("[brand] optimized SVG is pixel-identical to the approved source at 1024px");

async function renderSvg(source, destination, width, height) {
  const sourceText = await readFile(fromRoot(source), "utf8");
  const sourceUrl = `data:image/svg+xml;base64,${Buffer.from(sourceText).toString("base64")}`;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><style>html,body{width:100%;height:100%;margin:0;background:transparent;overflow:hidden}img{display:block;width:100%;height:100%}</style><img alt="" src="${sourceUrl}">`);
  await page.locator("img").evaluate((image) => image.decode?.());
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
icoHeader.writeUInt16LE(0, 0); icoHeader.writeUInt16LE(1, 2); icoHeader.writeUInt16LE(1, 4);
icoHeader.writeUInt8(32, 6); icoHeader.writeUInt8(32, 7); icoHeader.writeUInt16LE(1, 10); icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(faviconPng.length, 14); icoHeader.writeUInt32LE(22, 18);
await writeFile(fromRoot("public/favicon.ico"), Buffer.concat([icoHeader, faviconPng]));
console.log("[brand] public/favicon.ico 32x32");
