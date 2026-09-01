import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { HomePage } from "./home-page";

function subject() { return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><HomePage /></MemoryRouter></QueryClientProvider>); }
test("uses the product voice and clear table entry points", () => { subject(); expect(screen.getByRole("heading", { name: /liberati delle carte.*condanna l’ultimo/i })).toBeInTheDocument(); expect(screen.getByRole("button", { name: /crea il tavolo/i })).toBeDisabled(); expect(screen.getByRole("button", { name: /entra con un invito/i })).toBeInTheDocument(); expect(screen.getByText(/nessun jolly.*nessuna pietà/i)).toBeInTheDocument(); expect(screen.queryByText(/tavolo digitale per la vostra serata/i)).not.toBeInTheDocument(); });
test("describes the ten as banishing cards on the table", () => { subject(); expect(screen.getByText("Bandisce tutte le carte sul tavolo.")).toBeInTheDocument(); expect(screen.queryByText(/bandisce.*giocatore/i)).not.toBeInTheDocument(); });
