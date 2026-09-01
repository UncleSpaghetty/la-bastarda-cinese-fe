import { resolveRouteId, resolveRouteMetadata } from "./route-metadata";

const SITE_URL = "https://carte.example";

describe("route metadata resolver", () => {
  it("resolves the public homepage with its canonical metadata", () => {
    const metadata = resolveRouteMetadata("/?utm_source=test#hero", SITE_URL);
    expect(resolveRouteId("/")).toBe("home");
    expect(metadata).toMatchObject({
      title: "La bastarda cinese | Gioco di carte multiplayer online",
      canonicalPath: "/",
      robots: "index, follow",
    });
    expect(metadata.openGraph?.image).toBe(`${SITE_URL}/social/og-default.png`);
  });

  it.each([
    ["/invite/secret-token", "invite", "Sei stato invitato"],
    ["/rooms/94e1f99e", "lobby", "Lobby privata"],
    ["/matches/private-id/setup", "setup", "Preparazione della partita"],
    ["/matches/private-id", "match", "Partita in corso"],
    ["/matches/private-id/result", "result", "Risultato della partita"],
    ["/history?range=30d", "history", "Storico e statistiche"],
    ["/profile", "account", "Account e preferenze"],
  ])("resolves %s as private %s metadata", (path, routeId, title) => {
    const metadata = resolveRouteMetadata(path, SITE_URL);
    expect(resolveRouteId(path)).toBe(routeId);
    expect(metadata.title).toBe(`${title} | La bastarda cinese`);
    expect(metadata.robots).toBe("noindex, nofollow");
    expect(metadata.canonicalPath).toBeUndefined();
  });

  it.each([
    "/rules",
    "/leaderboard",
    "/login",
    "/register",
    "/create-room",
    "/privacy",
    "/terms",
    "/spectator",
    "/qualunque-cosa",
  ])("does not invent the absent route %s", (path) => {
    const metadata = resolveRouteMetadata(path, SITE_URL);
    expect(resolveRouteId(path)).toBe("not-found");
    expect(metadata.title).toBe("Questa carta non esiste | La bastarda cinese");
    expect(metadata.robots).toBe("noindex, nofollow");
  });

  it("never exposes tokens, private ids, usernames, queries, or hashes", () => {
    const secrets = ["invite-token-123", "match-uuid-456", "utentePrivato", "secret-query"];
    const cases = [
      "/invite/invite-token-123?username=utentePrivato#secret-query",
      "/matches/match-uuid-456?username=utentePrivato#secret-query",
    ];
    for (const path of cases) {
      const serialized = JSON.stringify(resolveRouteMetadata(path, SITE_URL));
      for (const secret of secrets) expect(serialized).not.toContain(secret);
    }
  });

  it("normalizes trailing slashes without creating alternate canonicals", () => {
    expect(resolveRouteId("https://private.example/history/?range=all#chart")).toBe("history");
    expect(resolveRouteMetadata("/?range=all#chart", SITE_URL).canonicalPath).toBe("/");
  });
});
