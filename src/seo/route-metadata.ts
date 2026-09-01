import {
  APP_NAME,
  DEFAULT_SOCIAL_IMAGE_ALT,
  DEFAULT_SOCIAL_IMAGE_PATH,
  absolutePublicUrl,
  withProductName,
  type PageMetadata,
} from "./metadata";
import { getHomepageStructuredData } from "./structured-data";

const HOME_TITLE = `${APP_NAME} | Gioco di carte multiplayer online`;
const HOME_DESCRIPTION =
  "Liberati delle carte, rovina i piani degli amici e condanna l’ultimo rimasto. Gioca online a La bastarda cinese in stanze private da 4 a 10 giocatori.";

type RouteDefinition = {
  id:
    | "home"
    | "invite"
    | "lobby"
    | "setup"
    | "match"
    | "result"
    | "history"
    | "account"
    | "not-found";
  matches: (pathname: string) => boolean;
  metadata: (siteUrl: string) => PageMetadata;
};

function privateMetadata(
  title: string,
  description: string,
  siteUrl: string,
  includeSocialImage = false
): PageMetadata {
  const image = includeSocialImage
    ? absolutePublicUrl(DEFAULT_SOCIAL_IMAGE_PATH, siteUrl)
    : undefined;
  return {
    title: withProductName(title),
    description,
    robots: "noindex, nofollow",
    openGraph: {
      type: "website",
      ...(image ? { image, imageAlt: DEFAULT_SOCIAL_IMAGE_ALT } : {}),
    },
    twitter: image
      ? { card: "summary_large_image", image, imageAlt: DEFAULT_SOCIAL_IMAGE_ALT }
      : undefined,
  };
}

export const ROUTE_DEFINITIONS: RouteDefinition[] = [
  {
    id: "home",
    matches: (pathname) => pathname === "/",
    metadata: (siteUrl) => {
      const image = absolutePublicUrl(DEFAULT_SOCIAL_IMAGE_PATH, siteUrl);
      return {
        title: HOME_TITLE,
        description: HOME_DESCRIPTION,
        canonicalPath: "/",
        robots: "index, follow",
        openGraph: { type: "website", image, imageAlt: DEFAULT_SOCIAL_IMAGE_ALT },
        twitter: { card: "summary_large_image", image, imageAlt: DEFAULT_SOCIAL_IMAGE_ALT },
        structuredData: getHomepageStructuredData(siteUrl),
      };
    },
  },
  {
    id: "invite",
    matches: (pathname) => /^\/invite\/[^/]+$/.test(pathname),
    metadata: (siteUrl) =>
      privateMetadata(
        "Sei stato invitato",
        "Qualcuno ha deciso di trascinarti al tavolo. Entra nella stanza e scegli se giocare o guardare il disastro.",
        siteUrl,
        true
      ),
  },
  {
    id: "lobby",
    matches: (pathname) => /^\/rooms\/[^/]+$/.test(pathname),
    metadata: (siteUrl) =>
      privateMetadata(
        "Lobby privata",
        "Configura il tavolo, scegli il tuo ruolo e preparati alla partita.",
        siteUrl
      ),
  },
  {
    id: "setup",
    matches: (pathname) => /^\/matches\/[^/]+\/setup$/.test(pathname),
    metadata: (siteUrl) =>
      privateMetadata(
        "Preparazione della partita",
        "Scegli le carte iniziali e preparati al tavolo.",
        siteUrl
      ),
  },
  {
    id: "result",
    matches: (pathname) => /^\/matches\/[^/]+\/result$/.test(pathname),
    metadata: (siteUrl) =>
      privateMetadata(
        "Risultato della partita",
        "La partita è terminata. È il momento di contare i danni.",
        siteUrl
      ),
  },
  {
    id: "match",
    matches: (pathname) => /^\/matches\/[^/]+$/.test(pathname),
    metadata: (siteUrl) => privateMetadata("Partita in corso", "La partita è in corso.", siteUrl),
  },
  {
    id: "history",
    matches: (pathname) => pathname === "/history",
    metadata: (siteUrl) =>
      privateMetadata(
        "Storico e statistiche",
        "Consulta partite, risultati e statistiche del tuo profilo.",
        siteUrl
      ),
  },
  {
    id: "account",
    matches: (pathname) => pathname === "/profile",
    metadata: (siteUrl) =>
      privateMetadata(
        "Account e preferenze",
        "Gestisci profilo, identità, preferenze di gioco, privacy e dati.",
        siteUrl
      ),
  },
  {
    id: "not-found",
    matches: () => true,
    metadata: (siteUrl) =>
      privateMetadata(
        "Questa carta non esiste",
        "La pagina che stavi cercando è stata bandita dal tavolo.",
        siteUrl
      ),
  },
];

export function normalizePathname(input: string): string {
  const pathname = new URL(input, "https://route.invalid").pathname;
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

export function resolveRouteMetadata(
  input: string,
  siteUrl = "https://invalid.example"
): PageMetadata {
  const pathname = normalizePathname(input);
  return ROUTE_DEFINITIONS.find((route) => route.matches(pathname))!.metadata(siteUrl);
}

export function resolveRouteId(input: string): RouteDefinition["id"] {
  const pathname = normalizePathname(input);
  return ROUTE_DEFINITIONS.find((route) => route.matches(pathname))!.id;
}
