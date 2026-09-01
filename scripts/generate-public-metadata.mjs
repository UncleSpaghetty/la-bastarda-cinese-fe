import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { publicSiteUrl as siteUrl } from "./public-config.mjs";
const files = ["robots.txt", "sitemap.xml"];

for (const filename of files) {
  const path = resolve("dist", filename);
  const template = await readFile(path, "utf8");
  const rendered = template.replaceAll("%VITE_PUBLIC_SITE_URL%", siteUrl);
  if (rendered.includes("%VITE_PUBLIC_SITE_URL%")) {
    throw new Error(`[build] Unresolved public URL placeholder in ${filename}.`);
  }
  await writeFile(path, rendered, "utf8");
}
