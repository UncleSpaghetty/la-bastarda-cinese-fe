import { useEffect } from "react";

import {
  APP_NAME,
  DEFAULT_SOCIAL_IMAGE_ALT,
  THEME_COLOR,
  absolutePublicUrl,
  getPublicSiteUrl,
  type PageMetadata,
} from "./metadata";
import { resolveRouteMetadata } from "./route-metadata";

const MANAGED_ATTRIBUTE = "data-seo-managed";

function appendMeta(
  fragment: DocumentFragment,
  attribute: "name" | "property",
  key: string,
  content?: string
) {
  if (!content) return;
  const meta = document.createElement("meta");
  meta.setAttribute(MANAGED_ATTRIBUTE, "true");
  meta.setAttribute(attribute, key);
  meta.content = content;
  fragment.append(meta);
}

function addSocialMetadata(
  fragment: DocumentFragment,
  metadata: PageMetadata,
  canonicalUrl?: string
) {
  const og = metadata.openGraph;
  const ogTitle = og?.title ?? metadata.title;
  const ogDescription = og?.description ?? metadata.description;
  appendMeta(fragment, "property", "og:type", og?.type ?? "website");
  appendMeta(fragment, "property", "og:site_name", APP_NAME);
  appendMeta(fragment, "property", "og:locale", "it_IT");
  appendMeta(fragment, "property", "og:title", ogTitle);
  appendMeta(fragment, "property", "og:description", ogDescription);
  appendMeta(fragment, "property", "og:url", canonicalUrl);
  if (og?.image) {
    appendMeta(fragment, "property", "og:image", og.image);
    appendMeta(fragment, "property", "og:image:secure_url", og.image);
    appendMeta(fragment, "property", "og:image:type", "image/png");
    appendMeta(fragment, "property", "og:image:width", "1200");
    appendMeta(fragment, "property", "og:image:height", "630");
    appendMeta(fragment, "property", "og:image:alt", og.imageAlt ?? DEFAULT_SOCIAL_IMAGE_ALT);
  }

  const twitter = metadata.twitter;
  appendMeta(fragment, "name", "twitter:card", twitter?.card ?? "summary");
  appendMeta(fragment, "name", "twitter:title", twitter?.title ?? metadata.title);
  appendMeta(fragment, "name", "twitter:description", twitter?.description ?? metadata.description);
  appendMeta(fragment, "name", "twitter:image", twitter?.image);
  appendMeta(fragment, "name", "twitter:image:alt", twitter?.imageAlt);
}

function safeJsonLd(value: PageMetadata["structuredData"]): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function SeoHead({ pathname }: { pathname: string }) {
  useEffect(() => {
    const siteUrl = getPublicSiteUrl();
    const metadata = resolveRouteMetadata(pathname, siteUrl);
    const canonicalUrl = metadata.canonicalPath
      ? absolutePublicUrl(metadata.canonicalPath, siteUrl)
      : undefined;
    document.head.querySelectorAll(`[${MANAGED_ATTRIBUTE}]`).forEach((element) => element.remove());

    const fragment = document.createDocumentFragment();
    const title = document.createElement("title");
    title.setAttribute(MANAGED_ATTRIBUTE, "true");
    title.textContent = metadata.title;
    fragment.append(title);
    appendMeta(fragment, "name", "description", metadata.description);
    appendMeta(fragment, "name", "robots", metadata.robots);
    appendMeta(fragment, "name", "theme-color", THEME_COLOR);

    if (canonicalUrl) {
      const canonical = document.createElement("link");
      canonical.setAttribute(MANAGED_ATTRIBUTE, "true");
      canonical.rel = "canonical";
      canonical.href = canonicalUrl;
      fragment.append(canonical);
    }

    addSocialMetadata(fragment, metadata, canonicalUrl);
    if (metadata.structuredData) {
      const script = document.createElement("script");
      script.setAttribute(MANAGED_ATTRIBUTE, "true");
      script.type = "application/ld+json";
      script.textContent = safeJsonLd(metadata.structuredData);
      fragment.append(script);
    }
    document.head.append(fragment);

    return () => {
      document.head
        .querySelectorAll(`[${MANAGED_ATTRIBUTE}]`)
        .forEach((element) => element.remove());
    };
  }, [pathname]);

  return null;
}
