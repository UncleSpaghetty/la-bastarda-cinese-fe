import { STAT_LABELS, statisticLabel } from "./api";
test("maps every known statistic to Italian product copy", () => {
  expect(Object.keys(STAT_LABELS)).toHaveLength(12);
  expect(statisticLabel("cards.played")).toBe("Carte giocate");
  expect(statisticLabel("matches.finished")).toBe("Uscite regolari");
  expect(statisticLabel("table.collected")).toBe("Tavoli raccolti");
});
test("never exposes an unknown technical key", () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  expect(statisticLabel("server.new_metric")).toBe("Statistica non disponibile");
  expect(warning).toHaveBeenCalledWith("Unknown statistic key received", {
    key: "server.new_metric",
  });
  warning.mockRestore();
});
