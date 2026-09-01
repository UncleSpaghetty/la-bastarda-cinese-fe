import { loadEnv } from "vite";

const fileEnv = loadEnv("production", process.cwd(), "");

export const publicSiteUrl = (
  process.env.VITE_PUBLIC_SITE_URL ??
  fileEnv.VITE_PUBLIC_SITE_URL ??
  ""
).trim();
export const publicAppName = (
  process.env.VITE_PUBLIC_APP_NAME ??
  fileEnv.VITE_PUBLIC_APP_NAME ??
  "La bastarda cinese"
).trim();
