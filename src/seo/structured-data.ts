import { APP_NAME, absolutePublicUrl } from "./metadata";

export function getHomepageStructuredData(siteUrl?: string): Array<Record<string, unknown>> {
  const homepage = absolutePublicUrl("/", siteUrl);
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: APP_NAME,
      url: homepage,
      inLanguage: "it-IT",
    },
    {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: APP_NAME,
      url: homepage,
      description: "Gioco di carte multiplayer online per stanze private da 4 a 10 giocatori.",
      applicationCategory: "GameApplication",
      operatingSystem: "Web browser",
      gamePlatform: "Web browser",
      playMode: "MultiPlayer",
      inLanguage: "it-IT",
      numberOfPlayers: {
        "@type": "QuantitativeValue",
        minValue: 4,
        maxValue: 10,
      },
      image: absolutePublicUrl("/social/og-default.png", siteUrl),
    },
  ];
}
