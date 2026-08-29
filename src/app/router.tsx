import { createBrowserRouter, Navigate } from "react-router";

import { AppShell } from "@/components/layout/app-shell";
import { PlaceholderPage } from "@/features/foundation/placeholder-page";
import { HomePage } from "@/features/home/home-page";

export const router = createBrowserRouter([{
  element: <AppShell />,
  children: [
    { path: "/", element: <HomePage /> },
    { path: "/invite/:token", element: <PlaceholderPage title="Accedi alla stanza" /> },
    { path: "/rooms/:id", element: <PlaceholderPage title="Lobby privata" /> },
    { path: "/matches/:id/setup", element: <PlaceholderPage title="Prepara le carte" /> },
    { path: "/matches/:id", element: <PlaceholderPage title="Tavolo" /> },
    { path: "/matches/:id/result", element: <PlaceholderPage title="Risultato" /> },
    { path: "/profile", element: <PlaceholderPage title="Profilo" /> },
    { path: "/history", element: <PlaceholderPage title="Storico" /> },
    { path: "*", element: <Navigate to="/" replace /> },
  ],
}]);
