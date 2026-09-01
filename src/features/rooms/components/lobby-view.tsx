import { ActionFeedback } from "@/components/feedback/action-feedback";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { TurnTimer } from "@/components/game/turn-timer";

import type { useLobby } from "../hooks/use-lobby";
import { RoomSettingsPanel } from "../room-settings-panel";

/** Pure render of the room lobby; all state and handlers come from useLobby(). */
export function LobbyView({ state }: { state: ReturnType<typeof useLobby> }) {
  const { room, presets } = state;
  if (room.isLoading)
    return (
      <section className="form-page">
        <p>Caricamento lobby…</p>
      </section>
    );
  if (!room.data)
    return (
      <section className="form-page">
        <p role="alert">Lobby non disponibile.</p>
      </section>
    );

  return (
    <section className="lobby-page">
      <div>
        <p className="eyebrow">Lobby privata</p>
        <h1>La serata comincia qui.</h1>
        <ActionFeedback message={state.feedback?.message} tone={state.feedback?.tone} />
        {state.inviteUrl && (
          <div className="panel invite-panel">
            <div>
              <p className="eyebrow">Invita gli amici</p>
              <p className="muted">Condividi il collegamento privato con chi vuoi al tavolo.</p>
            </div>
            <button className="button button-secondary" onClick={state.copyInvite}>
              Copia link d'invito
            </button>
          </div>
        )}
        {room.data.countdown_deadline && (
          <div className="countdown panel" role="status">
            <strong>Tutti pronti. La partita sta per iniziare…</strong>
            <TurnTimer deadline={room.data.countdown_deadline} label="Si parte tra" compact />
          </div>
        )}
        <div className="member-grid">
          {room.data.members.map((member) => (
            <article className="panel member" key={member.id}>
              <PlayerAvatar
                name={member.display_name}
                seed={member.avatar_seed}
                url={member.avatar_url}
              />
              <div>
                <strong>{member.display_name}</strong>
                <p>
                  {member.role === "PLAYER" ? "Giocatore" : "Spectator"}
                  {member.is_host ? " · Host" : ""}
                </p>
              </div>
              <span className={member.ready && member.connected ? "ready" : "waiting"}>
                {!member.connected ? "Disconnesso" : member.ready ? "Pronto" : "In attesa"}
              </span>
            </article>
          ))}
        </div>
        <button
          className="button button-primary"
          onClick={() => state.ready(true)}
          disabled={state.readyPending || state.players.length < 4}
        >
          Sono pronto
        </button>
        {state.players.length < 4 && <p className="muted">Servono almeno quattro giocatori.</p>}
      </div>
      <aside className="settings">
        <div className="settings-heading">
          <p className="eyebrow">REGOLE DELLA SERATA</p>
          <h2>Configura il tavolo</h2>
        </div>
        {state.draft && state.self?.is_host ? (
          <RoomSettingsPanel
            catalog={presets.data}
            isLoading={presets.isLoading}
            isError={presets.isError}
            value={state.draft}
            isSaving={state.savePending}
            onChange={state.setDraft}
            onSubmit={state.saveSettings}
          />
        ) : (
          <dl className="panel">
            <div>
              <dt>Preset</dt>
              <dd>
                {presets.data?.presets.find((preset) => preset.code === room.data.settings.preset)
                  ?.label ?? "Configurazione personalizzata"}
              </dd>
            </div>
            <div>
              <dt>Turno</dt>
              <dd>{room.data.settings.turn_seconds}s</dd>
            </div>
            <div>
              <dt>Timeout</dt>
              <dd>{room.data.settings.max_consecutive_timeouts}</dd>
            </div>
          </dl>
        )}
      </aside>
    </section>
  );
}
