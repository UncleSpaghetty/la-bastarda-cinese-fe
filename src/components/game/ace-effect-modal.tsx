import { AnimatePresence, LazyMotion, domAnimation, m } from "motion/react";
import { Minus, Plus, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { PlayerView, PlayingCard } from "../../features/game/api";
import { TurnTimer } from "./turn-timer";

type Target = { id: string; display_name: string; total_card_count: number };

export function AceEffectModal({ phase, targets = [], own, hand, tableCards, deadline, pending, busy, onCommand }: {
  phase: string;
  targets?: Target[];
  own?: PlayerView;
  hand: PlayingCard[];
  tableCards: PlayingCard[];
  deadline: string | null;
  pending?: { target_player_id?: string } | null;
  busy: boolean;
  onCommand: (name: string, payload: object) => void;
}) {
  const visible = (phase === "ACE_TARGET" && targets.length > 0) || (phase === "ACE_RESPONSE" && pending?.target_player_id === own?.id);
  const [dismissed, setDismissed] = useState(false);
  const [targetId, setTargetId] = useState<string>();
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  useEffect(() => { setDismissed(false); setTargetId(undefined); setResponseCounts({}); }, [phase]);
  const responseCards = ["2", "10", "A"].map((rank) => ({ rank, cards: hand.filter((card) => card.rank === rank) })).filter((item) => item.cards.length);
  const targetName = targets.find((target) => target.id === targetId)?.display_name;

  return <LazyMotion features={domAnimation}><AnimatePresence>
    {visible && !dismissed ? <m.div className="ace-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <m.section className="ace-modal" role="dialog" aria-modal="true" aria-labelledby="ace-modal-title" initial={{ opacity: 0, y: 45, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 35, scale: .97 }} transition={{ type: "spring", stiffness: 330, damping: 30 }}>
        <header className="ace-modal-header"><div className="ace-symbol"><Sparkles size={22} /><span>♠</span></div><div><p className="eyebrow">Carta speciale</p><h2 id="ace-modal-title">Effetto dell’asso</h2><p>{phase === "ACE_TARGET" ? "Scegli un destinatario e preparati al contrattacco." : "Sei stato scelto. Adesso rispondi, se ne sei capace."}</p></div><button className="ace-close" onClick={() => setDismissed(true)} aria-label="Riduci effetto dell'asso"><X /></button></header>
        <div className="ace-steps" aria-label="Fasi dell'effetto"><span className="done"><b>1</b>Asso</span><i /><span className={phase === "ACE_TARGET" ? "active" : "done"}><b>2</b>Destinatario</span><i /><span className={phase === "ACE_RESPONSE" ? "active" : ""}><b>3</b>Risposta</span></div>
        <div className="ace-warning">⚠ Gli effetti si risolvono prima dell’uscita di un giocatore.</div>
        <div className="ace-modal-grid">
          <div className="ace-main">
            <div className="ace-section-title"><div><h3>{phase === "ACE_TARGET" ? "Scegli il destinatario" : "La tua risposta"}</h3><p>{phase === "ACE_TARGET" ? "Non puoi scegliere te stesso. Peccato." : "Puoi raccogliere oppure rispondere con 2, 10 o asso."}</p></div><TurnTimer deadline={deadline} label={phase === "ACE_TARGET" ? "Scegli entro" : "Rispondi entro"} compact /></div>
            {phase === "ACE_TARGET" ? <m.div className="ace-targets" layout>{targets.map((target) => <m.button layout key={target.id} className={targetId === target.id ? "selected" : ""} onClick={() => setTargetId(target.id)} whileTap={{ scale: .98 }}><span className="avatar-inline">{target.display_name.slice(0, 2).toUpperCase()}</span><strong>{target.display_name}</strong><small>{target.total_card_count} carte</small><i>{targetId === target.id ? "✓" : ""}</i></m.button>)}</m.div> : <div className="ace-responses"><button onClick={() => onCommand("collect_table", {})} disabled={busy}><b>🂠</b><span><strong>Raccogli il tavolo</strong><small>Prendi tutto. Che affare.</small></span></button>{responseCards.map(({ rank, cards }) => { const count = Math.min(responseCounts[rank] ?? 1, cards.length); return <div className="ace-response-option" key={rank}><b>{rank}</b><span><strong>{rank === "2" ? "Annulla" : rank === "10" ? "Bandisci il tavolo" : "Reindirizza"}</strong><small>{cards.length > 1 ? `Scegli quante carte usare (disponibili: ${cards.length}).` : rank === "2" ? "Azzera l'effetto dell'asso." : rank === "10" ? "Rimuove tutte le carte dal tavolo." : "Scegli un nuovo destinatario."}</small></span><div className="ace-card-quantity" aria-label={`Numero di carte ${rank}`}><button type="button" aria-label={`Usa una carta ${rank} in meno`} disabled={count <= 1 || busy} onClick={() => setResponseCounts((value) => ({ ...value, [rank]: count - 1 }))}><Minus size={15} /></button><strong>{count}</strong><button type="button" aria-label={`Usa una carta ${rank} in più`} disabled={count >= cards.length || busy} onClick={() => setResponseCounts((value) => ({ ...value, [rank]: count + 1 }))}><Plus size={15} /></button></div><button className="button button-primary ace-play-response" disabled={busy} onClick={() => onCommand("play_cards", { card_ids: cards.slice(0, count).map((card) => card.id) })}>Gioca {count}</button></div>; })}</div>}
            {phase === "ACE_TARGET" && <button className="button button-primary ace-confirm" disabled={!targetId || busy} onClick={() => onCommand("select_ace_target", { target_player_id: targetId })}>Conferma {targetName ? `· ${targetName}` : "destinatario"}</button>}
          </div>
          <aside className="ace-preview"><h3>Possibili risposte</h3><p>Il destinatario potrà scegliere:</p><ul><li><b>🂠</b><span><strong>Raccogli il tavolo</strong><small>Prende tutte le carte.</small></span></li><li><b>2</b><span><strong>Annulla</strong><small>Azzera l’effetto.</small></span></li><li><b>10</b><span><strong>Bandisci</strong><small>Brucia il tavolo.</small></span></li><li><b>A</b><span><strong>Reindirizza</strong><small>Sceglie un altro bersaglio.</small></span></li></ul></aside>
        </div>
        <footer className="ace-table-preview"><span>Tavolo</span><div>{tableCards.slice(-4).map((card) => <i key={card.id}>{card.rank}</i>)}{!tableCards.length && <small>Vuoto</small>}</div></footer>
      </m.section>
    </m.div> : null}
  </AnimatePresence></LazyMotion>;
}
