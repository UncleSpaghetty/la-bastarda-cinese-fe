import { render, screen } from "@testing-library/react";

import { HomePage } from "./home-page";

test("presents the private-room entry points", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { name: /tavolo digitale/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /crea una stanza/i })).toBeEnabled();
  expect(screen.getByText(/carte private protette/i)).toBeInTheDocument();
});
