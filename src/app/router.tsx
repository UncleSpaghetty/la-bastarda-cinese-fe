import { createBrowserRouter, Navigate } from "react-router";

import { AppShell } from "@/components/layout/app-shell";
import { PlaceholderPage } from "@/features/foundation/placeholder-page";
import { HomePage } from "@/features/home/home-page";
import { InvitePage } from "@/features/rooms/invite-page";
import { LobbyPage } from "@/features/rooms/lobby-page";
import { SetupPage } from "@/features/game/setup-page";

export const router = createBrowserRouter([{
  element: <AppShell />,
  children: [
    { path: "/", element: <HomePage /> },
    { path: "/invite/:token", element: <InvitePage /> },
    { path: "/rooms/:id", element: <LobbyPage /> },
    { path: "/matches/:id/setup", element: <SetupPage /> },
    { path: "/matches/:id", element: <PlaceholderPage title="Tavolo" /> },
    { path: "/matches/:id/result", element: <PlaceholderPage title="Risultato" /> },
    { path: "/profile", element: <PlaceholderPage title="Profilo" /> },
    { path: "/history", element: <PlaceholderPage title="Storico" /> },
    { path: "*", element: <Navigate to="/" replace /> },
  ],
}]);
