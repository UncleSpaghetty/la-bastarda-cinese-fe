import { publicSiteUrl as siteUrl } from "./public-config.mjs";

if (!siteUrl) {
  console.error(
    "[build] VITE_PUBLIC_SITE_URL is required. Set it to the canonical production origin, for example https://game.example.it."
  );
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(siteUrl);
} catch {
  console.error(`[build] VITE_PUBLIC_SITE_URL is not a valid absolute URL: ${siteUrl}`);
  process.exit(1);
}

if (parsed.protocol !== "https:") {
  console.error("[build] VITE_PUBLIC_SITE_URL must use HTTPS in production.");
  process.exit(1);
}

if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
  console.error(
    "[build] VITE_PUBLIC_SITE_URL must contain only the public origin, without credentials, path, query, or hash."
  );
  process.exit(1);
}

if (siteUrl.endsWith("/")) {
  console.error("[build] VITE_PUBLIC_SITE_URL must not end with a slash.");
  process.exit(1);
}
