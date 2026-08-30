import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import { HomePage } from "./home-page";

test("presents the private-room entry points", () => {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><HomePage /></MemoryRouter></QueryClientProvider>);
  expect(screen.getByRole("heading", { name: /tavolo digitale/i })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /nome al tavolo/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /crea stanza/i })).toBeDisabled();
  expect(screen.getByText(/carte private protette/i)).toBeInTheDocument();
});
