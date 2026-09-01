import { createBrowserRouter } from "react-router";

import { AppShell } from "@/components/layout/app-shell";
import { HomePage } from "@/features/home/home-page";
import { InvitePage } from "@/features/rooms/invite-page";
import { LobbyPage } from "@/features/rooms/lobby-page";
import { SetupPage } from "@/features/game/setup-page";
import { MatchPage } from "@/features/game/match-page";
import { ProfilePage } from "@/features/account/profile-page";
import { HistoryPage } from "@/features/history/history-page";
import { ResultPage } from "@/features/game/result-page";
import { NotFoundPage } from "@/features/not-found/not-found-page";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/invite/:token", element: <InvitePage /> },
      { path: "/rooms/:id", element: <LobbyPage /> },
      { path: "/matches/:id/setup", element: <SetupPage /> },
      { path: "/matches/:id", element: <MatchPage /> },
      { path: "/matches/:id/result", element: <ResultPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/history", element: <HistoryPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
