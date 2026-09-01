export const APP_NAME = import.meta.env.VITE_PUBLIC_APP_NAME?.trim() || "La bastarda cinese";
export const THEME_COLOR = "#07142F";
export const DEFAULT_SOCIAL_IMAGE_PATH = "/social/og-default.png";
export const DEFAULT_SOCIAL_IMAGE_ALT =
  "Logo di La bastarda cinese con carte da gioco su sfondo blu notte";

export type PageMetadata = {
  title: string;
  description: string;
  canonicalPath?: string;
  robots: "index, follow" | "noindex, nofollow";
  openGraph?: {
    title?: string;
    description?: string;
    type?: "website" | "article";
    image?: string;
    imageAlt?: string;
  };
  twitter?: {
    card?: "summary" | "summary_large_image";
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
  };
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
};

export function getPublicSiteUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://invalid.example";
}

export function absolutePublicUrl(path: string, siteUrl = getPublicSiteUrl()): string {
  const origin = siteUrl.replace(/\/$/, "");
  const safePath = `/${path.replace(/^\/+/, "").split(/[?#]/, 1)[0]}`;
  return new URL(safePath, `${origin}/`).toString();
}

export function withProductName(pageTitle: string): string {
  return `${pageTitle} | ${APP_NAME}`;
}
