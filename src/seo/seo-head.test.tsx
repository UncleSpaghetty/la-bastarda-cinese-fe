import { act, render, waitFor } from "@testing-library/react";

import { SeoHead } from "./SeoHead";

function expectSingle(selector: string) {
  expect(document.head.querySelectorAll(selector)).toHaveLength(1);
}

describe("SeoHead", () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <title data-seo-managed>Fallback</title>
      <meta data-seo-managed name="description" content="Fallback">
      <link data-seo-managed rel="canonical" href="https://old.example/">
      <meta data-seo-managed property="og:title" content="Fallback">
      <meta data-seo-managed property="og:image" content="https://old.example/old.png">
    `;
  });

  it("renders exactly one set of homepage metadata", async () => {
    render(<SeoHead pathname="/" />);
    await waitFor(() => expect(document.title).toBe("La bastarda cinese | Gioco di carte multiplayer online"));
    expectSingle("title");
    expectSingle('meta[name="description"]');
    expectSingle('link[rel="canonical"]');
    expectSingle('meta[property="og:title"]');
    expectSingle('meta[property="og:image"]');
    expectSingle('script[type="application/ld+json"]');
  });

  it("removes stale tags over forward and back-style route changes", async () => {
    const view = render(<SeoHead pathname="/" />);
    await waitFor(() => expect(document.head.querySelector('link[rel="canonical"]')).toBeInTheDocument());

    act(() => view.rerender(<SeoHead pathname="/invite/do-not-leak" />));
    await waitFor(() => expect(document.title).toBe("Sei stato invitato | La bastarda cinese"));
    expect(document.head.querySelector('link[rel="canonical"]')).not.toBeInTheDocument();
    expect(document.head.innerHTML).not.toContain("do-not-leak");
    expect(document.head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
    expectSingle('meta[name="description"]');
    expectSingle('meta[property="og:title"]');
    expectSingle('meta[property="og:image"]');

    act(() => view.rerender(<SeoHead pathname="/" />));
    await waitFor(() => expect(document.title).toBe("La bastarda cinese | Gioco di carte multiplayer online"));
    expectSingle('link[rel="canonical"]');
    expectSingle('meta[name="description"]');
    expectSingle('meta[property="og:title"]');
    expectSingle('meta[property="og:image"]');
  });

  it("keeps private match ids and state out of the DOM head", async () => {
    render(<SeoHead pathname="/matches/92a40d50-private?hand=ace#secret" />);
    await waitFor(() => expect(document.title).toBe("Partita in corso | La bastarda cinese"));
    expect(document.head.textContent).not.toContain("92a40d50-private");
    expect(document.head.innerHTML).not.toContain("hand=ace");
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  });
});
