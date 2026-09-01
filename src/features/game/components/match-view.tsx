import { ActionFeedback } from "@/components/feedback/action-feedback";
import { AceEffectModal } from "@/components/game/ace-effect-modal";

import type { useMatch } from "../hooks/use-match";
import {
  CardMovementLayer,
  GameArena,
  GameEventLog,
  GameHeader,
  LocalPlayerDock,
  SharedTable,
} from "../game-table-components";

/** Pure render of the match table; all state and handlers come from useMatch(). */
export function MatchView({ state }: { state: ReturnType<typeof useMatch> }) {
  const { match, own } = state;
  if (!match)
    return (
      <section className="form-page">
        <p>Sincronizzazione del tavolo…</p>
      </section>
    );

  return (
    <section className={`game-table-page ${own ? "" : "is-spectator"}`}>
      <ActionFeedback message={state.feedback?.message} tone={state.feedback?.tone} />
      {state.specialNotice && (
        <div className="special-toast" role="status">
          <span>♠</span>
          {state.specialNotice}
        </div>
      )}
      <CardMovementLayer animations={state.animations} />
      <AceEffectModal
        phase={match.payload.phase}
        targets={match.payload.eligible_ace_targets}
        own={own}
        hand={state.playableVisible}
        tableCards={match.payload.table_cards}
        deadline={match.deadline}
        pending={match.payload.pending_effect}
        busy={state.busy}
        onCommand={state.command}
      />
      <GameHeader
        matchId={state.matchId}
        phase={match.payload.phase}
        activeName={state.active?.display_name}
        deadline={match.deadline}
        isOwnTurn={state.isOwnTurn}
        onBack={() => state.navigate(-1)}
        onHistory={() => state.setHistoryOpen((open) => !open)}
        historyCount={state.historyOpen ? 0 : (match.payload.recent_events?.length ?? 0)}
        onExit={() => state.navigate("/")}
      />
      {!own && (
        <div className="spectator-banner" role="status">
          Modalità spettatore · stato pubblico in sola lettura
        </div>
      )}
      <div className={`game-stage ${state.historyOpen ? "with-history" : ""}`}>
        <GameArena
          layout={state.layout}
          turnSeat={match.payload.turn_seat}
          table={
            <SharedTable
              cards={match.payload.table_cards}
              deckCount={match.payload.deck_count}
              constraint={match.payload.constraint}
              pendingEffect={match.payload.pending_effect}
            />
          }
          localDock={
            own ? (
              <LocalPlayerDock
                player={own}
                active={state.isOwnTurn}
                selected={state.selected}
                onToggle={state.toggle}
                onCovered={state.chooseCovered}
                busy={state.busy}
                onPlay={state.play}
                onCollect={state.collect}
              />
            ) : undefined
          }
        />
        <GameEventLog
          events={match.payload.recent_events}
          open={state.historyOpen}
          onClose={() => state.setHistoryOpen(false)}
        />
        {state.historyOpen && (
          <button
            className="event-log-backdrop"
            type="button"
            aria-label="Chiudi eventi"
            onClick={() => state.setHistoryOpen(false)}
          />
        )}
      </div>
    </section>
  );
}
