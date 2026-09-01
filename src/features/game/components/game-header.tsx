import { BookOpen, ChevronLeft, History, LogOut, MoreHorizontal, Settings } from "lucide-react";

import { TurnTimer } from "@/components/game/turn-timer";
import { ConnectionStatus } from "@/components/realtime/connection-status";

const phaseLabel: Record<string, string> = {
  SETUP: "Preparazione",
  TURN: "In corso",
  ACE_TARGET: "Scelta dell'asso",
  ACE_RESPONSE: "Catena dell'asso",
  COMPLETED: "Conclusa",
  ABANDONED: "Abbandonata",
};

export function GameHeader({
  matchId,
  phase,
  activeName,
  deadline,
  isOwnTurn,
  onBack,
  onHistory,
  historyCount,
  onExit,
}: {
  matchId: string;
  phase: string;
  activeName?: string;
  deadline: string | null;
  isOwnTurn: boolean;
  onBack: () => void;
  onHistory: () => void;
  historyCount: number;
  onExit: () => void;
}) {
  return (
    <header className="game-header">
      <button
        className="game-icon-button"
        type="button"
        onClick={onBack}
        aria-label="Torna alla lobby"
      >
        <ChevronLeft />
      </button>
      <div className="game-brand">
        <img src="/brand/logo-mark.svg" width="32" height="32" alt="" aria-hidden="true" />
        <strong>La bastarda cinese</strong>
      </div>
      <div className="game-room-meta">
        <span>#{matchId.slice(0, 8)}</span>
        <b>{phaseLabel[phase] ?? phase}</b>
      </div>
      <div className={`game-turn-summary ${isOwnTurn ? "is-own" : ""}`}>
        <p>
          {isOwnTurn ? (
            "Tocca a te"
          ) : (
            <>
              Turno di <strong>{activeName ?? "—"}</strong>
            </>
          )}
        </p>
        <TurnTimer deadline={deadline} compact label="" />
      </div>
      <ConnectionStatus />
      <button
        className="game-icon-button game-history-button"
        type="button"
        onClick={onHistory}
        aria-label="Apri eventi di gioco"
      >
        <History />
        {historyCount > 0 && <span>{historyCount}</span>}
      </button>
      <details className="game-menu">
        <summary className="game-icon-button" aria-label="Menu partita">
          <MoreHorizontal />
        </summary>
        <div>
          <details className="game-rules-summary">
            <summary>
              <BookOpen /> Regole del gioco
            </summary>
            <p>
              Gioca carte dello stesso valore rispettando il vincolo. Il 2 azzera, il 7 impone ≤ 7,
              l’8 salta, il 10 bandisce il tavolo e l’asso assegna il tavolo.
            </p>
          </details>
          <button type="button" disabled>
            <Settings /> Impostazioni bloccate
          </button>
          <button type="button" onClick={onExit}>
            <LogOut /> Esci dal tavolo
          </button>
        </div>
      </details>
    </header>
  );
}
