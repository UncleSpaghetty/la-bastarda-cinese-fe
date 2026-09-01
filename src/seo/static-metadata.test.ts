import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { getHomepageStructuredData } from "./structured-data";

const SITE_URL = "https://canonical.example";

describe("static discovery metadata", () => {
  it("renders a sitemap containing only the real public homepage", () => {
    const sitemap = readFileSync(resolve(process.cwd(), "public/sitemap.xml"), "utf8").replaceAll(
      "%VITE_PUBLIC_SITE_URL%",
      SITE_URL
    );
    const document = new DOMParser().parseFromString(sitemap, "application/xml");
    expect(document.querySelector("parsererror")).toBeNull();
    expect(Array.from(document.querySelectorAll("loc"), (node) => node.textContent)).toEqual([
      `${SITE_URL}/`,
    ]);
    expect(sitemap).not.toMatch(/invite|rooms|matches|profile|history|login|register/);
  });

  it("uses the canonical domain in robots and references the sitemap", () => {
    const robots = readFileSync(resolve(process.cwd(), "public/robots.txt"), "utf8").replaceAll(
      "%VITE_PUBLIC_SITE_URL%",
      SITE_URL
    );
    expect(robots).toContain("Allow: /");
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    expect(robots).not.toContain("%VITE_PUBLIC_SITE_URL%");
  });

  it("produces serializable and factual homepage JSON-LD", () => {
    const data = getHomepageStructuredData(SITE_URL);
    expect(() => JSON.stringify(data)).not.toThrow();
    expect(data.filter((item) => item["@type"] === "WebSite")).toHaveLength(1);
    const game = data.find((item) => item["@type"] === "VideoGame");
    expect(game).toMatchObject({
      url: `${SITE_URL}/`,
      operatingSystem: "Web browser",
      gamePlatform: "Web browser",
      playMode: "MultiPlayer",
      image: `${SITE_URL}/social/og-default.png`,
    });
    const serialized = JSON.stringify(data);
    for (const fabricated of [
      "aggregateRating",
      "review",
      "offers",
      "price",
      "downloadCount",
      "datePublished",
    ]) {
      expect(serialized).not.toContain(fabricated);
    }
  });
});
