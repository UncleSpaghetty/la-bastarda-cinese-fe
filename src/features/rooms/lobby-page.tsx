import { LobbyView } from "./components/lobby-view";
import { useLobby } from "./hooks/use-lobby";

export function LobbyPage() {
  const state = useLobby();
  return <LobbyView state={state} />;
}
