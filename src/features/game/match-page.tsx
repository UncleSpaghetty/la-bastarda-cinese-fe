import { MatchView } from "./components/match-view";
import { useMatch } from "./hooks/use-match";

export function MatchPage() {
  const state = useMatch();
  return <MatchView state={state} />;
}
