import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const publicPath = (...parts: string[]) => resolve(process.cwd(), "public", ...parts);

const expectedPngs: Record<string, [number, number]> = {
  "favicon-16x16.png": [16, 16],
  "favicon-32x32.png": [32, 32],
  "apple-touch-icon.png": [180, 180],
  "icons/icon-192x192.png": [192, 192],
  "icons/icon-512x512.png": [512, 512],
  "icons/icon-maskable-192x192.png": [192, 192],
  "icons/icon-maskable-512x512.png": [512, 512],
  "social/og-default.png": [1200, 630],
  "social/og-square.png": [1200, 1200],
};

function pngDimensions(filename: string): [number, number] {
  const file = readFileSync(publicPath(filename));
  expect(file.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return [file.readUInt32BE(16), file.readUInt32BE(20)];
}

describe("brand and metadata assets", () => {
  it.each(Object.entries(expectedPngs))("has the correct PNG dimensions for %s", (filename, dimensions) => {
    expect(pngDimensions(filename)).toEqual(dimensions);
  });

  it("contains a valid ICO favicon", () => {
    const ico = readFileSync(publicPath("favicon.ico"));
    expect(ico.length).toBeGreaterThan(22);
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBeGreaterThanOrEqual(1);
  });

  it.each([
    "favicon.svg",
    "brand/logo-mark.svg",
    "brand/logo-horizontal.svg",
    "brand/logo-compact.svg",
    "brand/logo-monochrome.svg",
    "icons/app-icon.svg",
    "icons/app-icon-maskable.svg",
    "social/og-default.svg",
    "social/og-square.svg",
  ])("contains valid SVG source %s", (filename) => {
    const document = new DOMParser().parseFromString(readFileSync(publicPath(filename), "utf8"), "image/svg+xml");
    expect(document.querySelector("parsererror")).toBeNull();
    expect(document.documentElement.tagName).toBe("svg");
  });

  it("uses the card-based, path-only brand geometry", () => {
    const source = readFileSync(publicPath("brand/source-logo.svg"), "utf8");
    const original = readFileSync(publicPath("brand/source-logo.original.svg"), "utf8");
    const mark = readFileSync(publicPath("brand/logo-mark.svg"), "utf8");
    const favicon = readFileSync(publicPath("favicon.svg"), "utf8");
    expect(original).toContain("<metadata>");
    expect(source).not.toMatch(/<metadata|c2pa:|<image\b|data:image/i);
    expect(source.match(/<path\b/g)?.length).toBeGreaterThan(1);
    expect(mark).toContain('viewBox="256 224 512 576"');
    expect(mark.toLowerCase()).toContain('#fb5057');
    expect(mark.toLowerCase()).toContain('#413cbe');
    expect(mark).not.toMatch(/<text|font-family|data:image|<metadata/i);
    expect(favicon).not.toMatch(/<text|font-family|data:image|<metadata/i);
    for (const file of ["logo-horizontal.svg", "logo-compact.svg", "logo-monochrome.svg"]) {
      expect(readFileSync(publicPath("brand", file), "utf8")).not.toMatch(/<text|font-family|data:image|<metadata/i);
    }
    expect(readFileSync(publicPath("brand/logo-horizontal.svg"), "utf8")).toBe(mark);
    expect(readFileSync(publicPath("brand/logo-compact.svg"), "utf8")).toBe(mark);
  });

  it("keeps no obsolete app-icon sources in the brand directory", () => {
    expect(existsSync(publicPath("brand/app-icon.svg"))).toBe(false);
    expect(existsSync(publicPath("brand/app-icon-maskable.svg"))).toBe(false);
    expect(existsSync(publicPath("icons/app-icon.svg"))).toBe(true);
    expect(existsSync(publicPath("icons/app-icon-maskable.svg"))).toBe(true);
  });

  it("provides a repeatable brand generation command", () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(packageJson.scripts["generate:brand"]).toBe("node scripts/generate-brand-assets.mjs");
    expect(existsSync(resolve(process.cwd(), "scripts/generate-brand-assets.mjs"))).toBe(true);
  });

  it("declares only existing any and maskable manifest icons", () => {
    const manifest = JSON.parse(readFileSync(publicPath("site.webmanifest"), "utf8")) as {
      name: string;
      icons: Array<{ src: string; purpose: string; sizes: string }>;
    };
    expect(manifest.name).toBe("La bastarda cinese");
    expect(manifest.icons.some((icon) => icon.purpose === "any")).toBe(true);
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);
    for (const icon of manifest.icons) {
      expect(() => readFileSync(publicPath(icon.src.replace(/^\//, "")))).not.toThrow();
    }
  });

  it("keeps complete static homepage metadata in index.html", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toContain("<title data-seo-managed>La bastarda cinese | Gioco di carte multiplayer online</title>");
    expect(html).toContain('name="description" content="Liberati delle carte, rovina i piani degli amici e condanna l’ultimo rimasto.');
    expect(html).toContain('rel="canonical" href="%VITE_PUBLIC_SITE_URL%/"');
    expect(html).toContain('property="og:image" content="%VITE_PUBLIC_SITE_URL%/social/og-default.png"');
    expect(html).toContain('rel="manifest" href="/site.webmanifest"');
    expect(html).not.toContain('name="keywords"');
  });

  it("does not retain the old placeholder brand in either header", () => {
    const appShell = readFileSync(resolve(process.cwd(), "src/components/layout/app-shell.tsx"), "utf8");
    const gameHeader = readFileSync(resolve(process.cwd(), "src/features/game/game-table-components.tsx"), "utf8");
    expect(appShell).toContain('/brand/logo-mark.svg');
    expect(gameHeader).toContain('/brand/logo-mark.svg');
    expect(appShell).toContain('className="brand-wordmark"');
    expect(gameHeader).toContain("<strong>La bastarda cinese</strong>");
    expect(appShell).not.toMatch(/brand-mark[^>]*>B</);
    expect(gameHeader).not.toMatch(/game-brand[^>]*><span[^>]*>B</);
  });

  it("keeps public metadata and brand files outside the Vercel SPA rewrite", () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")) as {
      rewrites: Array<{ source: string; destination: string }>;
    };
    const source = config.rewrites[0].source;
    for (const publicAsset of ["brand/", "icons/", "social/", "favicon", "apple-touch-icon", "site", "robots", "sitemap"]) {
      expect(source).toContain(publicAsset);
    }
    expect(config.rewrites[0].destination).toBe("/index.html");
  });
});
