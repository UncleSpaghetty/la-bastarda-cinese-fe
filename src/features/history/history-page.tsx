import { HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";

import { HISTORY_COPY } from "@/content/copy";
import { getHistoryDashboard, OUTCOME_LABELS, statisticLabel } from "./api";
import type { HistoryDashboard } from "./api";
import { ActionChart, OutcomeChart, TimelineChart } from "./history-charts";

const presetLabels: Record<string, string> = { FAST: "Veloce", NORMAL: "Normale", RELAXED: "Rilassata", CUSTOM: "Personalizzata" };
const kpiHelp: Record<string, string> = {
  "matches.played": "Partite concluse nel periodo selezionato.", "matches.finished": "Partite lasciate regolarmente prima dell’ultimo.",
  "matches.lost": "Partite concluse come ultimo rimasto.", "player.retired": "Ritiri volontari o causati dai timeout.",
  "ace.reentered": "Volte in cui un asso ti ha richiamato al tavolo.", "turn.timeout": "Turni risolti automaticamente per scadenza.",
};

function duration(value: number) { const minutes = Math.floor(value / 60); return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`; }

export function HistoryPage() {
  const [params, setParams] = useSearchParams();
  if (!params.has("range")) params.set("range", "10");
  const history = useQuery({ queryKey: ["history-dashboard", params.toString()], queryFn: () => getHistoryDashboard(params) });
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next, { replace: true }); };

  return <section className="history-page page-container"><header className="page-heading"><p className="eyebrow">STORICO DELLE PARTITE</p><h1>{HISTORY_COPY.title}</h1><p>{HISTORY_COPY.description}</p></header>
    {history.isLoading && <DashboardSkeleton />}
    {history.isError && <div className="panel error-state" role="alert"><strong>Storico non disponibile.</strong><p>Non è stato possibile caricare i dati. Riprova tra poco.</p></div>}
    {history.data && !history.data.persistent && <div className="guest-history panel"><h2>Qui il rancore non resta</h2><p>Stai giocando come guest o anonimo. Accedi per conservare statistiche e storico tra un dispositivo e l’altro.</p><Link className="button button-primary" to="/profile">Accedi o crea un account</Link></div>}
    {history.data?.persistent && <>
      <div className="history-filters" aria-label="Filtri storico"><label>Periodo<select value={params.get("range") ?? "10"} onChange={(event) => update("range", event.target.value)}><option value="10">Ultime 10 partite</option><option value="20">Ultime 20 partite</option><option value="30d">Ultimi 30 giorni</option><option value="all">Tutto lo storico</option></select></label>
        {history.data.available_filters.presets.length > 1 && <label>Preset<select value={params.get("preset") ?? ""} onChange={(event) => update("preset", event.target.value)}><option value="">Tutti</option>{history.data.available_filters.presets.map((preset) => <option key={preset} value={preset}>{presetLabels[preset] ?? "Altro preset"}</option>)}</select></label>}
        {history.data.available_filters.player_counts.length > 1 && <label>Giocatori<select value={params.get("players") ?? ""} onChange={(event) => update("players", event.target.value)}><option value="">Tutti</option>{history.data.available_filters.player_counts.map((count) => <option key={count} value={count}>{count} giocatori</option>)}</select></label>}
        {history.data.available_filters.outcomes.length > 1 && <label>Esito<select value={params.get("outcome") ?? ""} onChange={(event) => update("outcome", event.target.value)}><option value="">Tutti</option>{history.data.available_filters.outcomes.map((outcome) => <option key={outcome} value={outcome}>{OUTCOME_LABELS[outcome]}</option>)}</select></label>}
      </div>
      {history.data.total_matches === 0 ? <div className="history-empty panel"><h2>{HISTORY_COPY.empty}</h2><p>Il tavolo è ancora troppo pulito. È il momento di rimediare.</p><Link className="button button-primary" to="/">Crea la prima partita</Link></div> : <>
        <div className="kpi-grid">{history.data.kpis.map((kpi) => <article className="kpi-card" key={kpi.key}><div><span>{statisticLabel(kpi.key)}</span><span className="tooltip-wrap"><button type="button" aria-label={`Informazioni su ${statisticLabel(kpi.key)}`}><HelpCircle /></button><span role="tooltip">{kpiHelp[kpi.key]}</span></span></div><strong>{kpi.value.toLocaleString("it-IT")}</strong>{kpi.change != null && <small>{kpi.change >= 0 ? "+" : ""}{kpi.change}% sul periodo precedente</small>}</article>)}</div>
        <div className="charts-grid"><article className="chart-panel"><header><p className="eyebrow">ESITI</p><h2>Come finiscono le tue partite</h2><p>Salvezze, ultimi posti e serate finite prima del previsto.</p></header><OutcomeChart data={history.data.outcomes} /></article><article className="chart-panel"><header><p className="eyebrow">ANDAMENTO</p><h2>Quanto spesso torni a farti del male</h2><p>Partite disputate settimana dopo settimana.</p></header><TimelineChart data={history.data.timeline} /></article><article className="chart-panel chart-wide"><header><p className="eyebrow">AZIONI</p><h2>Il tuo repertorio di cattive intenzioni</h2><p>Solo ciò che il tavolo ha davvero registrato.</p></header><ActionChart data={history.data.actions} /></article></div>
        <MatchHistory matches={history.data.matches} />
      </>}
    </>}
  </section>;
}

function MatchHistory({ matches }: { matches: HistoryDashboard["matches"] }) {
  return <section className="match-history" aria-labelledby="recent-matches"><header><p className="eyebrow">STORICO DETTAGLIATO</p><h2 id="recent-matches">Le ultime scene del crimine</h2></header><div className="history-table-wrap"><table><caption className="sr-only">Ultime partite con risultati e azioni personali</caption><thead><tr><th>Data</th><th>Durata</th><th>Giocatori</th><th>Preset</th><th>Risultato</th><th>Carte</th><th>Tavoli</th><th>Timeout</th><th><span className="sr-only">Dettaglio</span></th></tr></thead><tbody>{matches.map((match) => <tr key={match.id}><td>{new Date(match.date).toLocaleDateString("it-IT")}</td><td>{duration(match.duration_seconds)}</td><td>{match.player_count}</td><td>{presetLabels[match.preset] ?? "Personalizzata"}</td><td><span className={`outcome-badge outcome-${match.outcome.toLowerCase()}`}>{OUTCOME_LABELS[match.outcome]}</span></td><td>{match.cards_played}</td><td>{match.tables_collected}</td><td>{match.timeouts}</td><td>{match.replay_available && <Link to={`/matches/${match.id}/result`}>Dettaglio</Link>}</td></tr>)}</tbody></table></div><div className="history-mobile-cards">{matches.map((match) => <article key={match.id}><header><time>{new Date(match.date).toLocaleDateString("it-IT")}</time><span className={`outcome-badge outcome-${match.outcome.toLowerCase()}`}>{OUTCOME_LABELS[match.outcome]}</span></header><dl><div><dt>Durata</dt><dd>{duration(match.duration_seconds)}</dd></div><div><dt>Giocatori</dt><dd>{match.player_count}</dd></div><div><dt>Preset</dt><dd>{presetLabels[match.preset] ?? "Personalizzata"}</dd></div><div><dt>Carte giocate</dt><dd>{match.cards_played}</dd></div><div><dt>Tavoli raccolti</dt><dd>{match.tables_collected}</dd></div><div><dt>Timeout</dt><dd>{match.timeouts}</dd></div></dl>{match.replay_available && <Link to={`/matches/${match.id}/result`}>Apri il dettaglio</Link>}</article>)}</div></section>;
}

function DashboardSkeleton() { return <div className="dashboard-skeleton" aria-label="Caricamento statistiche"><div /><div /><div /><div /><div /><div /></div>; }
