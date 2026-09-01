import { OUTCOME_LABELS, statisticLabel } from "./api";
import type { HistoryDashboard } from "./api";

const outcomeColors = {
  FINISHED: "#6ee7b7",
  LOSER: "#fb7185",
  RETIRED: "#fbbf24",
  ABANDONED: "#94a3b8",
};

export function OutcomeChart({ data }: { data: HistoryDashboard["outcomes"] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <ChartEmpty />;
  let offset = 0;
  const stops = data.map((item) => {
    const start = offset;
    offset += (item.value / total) * 100;
    return `${outcomeColors[item.key]} ${start}% ${offset}%`;
  });
  return (
    <div className="chart-layout">
      <div
        className="donut-chart"
        role="img"
        aria-label={`Esiti di ${total} partite: ${data.map((item) => `${OUTCOME_LABELS[item.key]} ${item.value}`).join(", ")}`}
        style={{ background: `conic-gradient(${stops.join(",")})` }}
      >
        <span>
          {total}
          <small>partite</small>
        </span>
      </div>
      <ul className="chart-legend">
        {data.map((item) => (
          <li
            key={item.key}
            title={`${OUTCOME_LABELS[item.key]}: ${item.value} partite, ${Math.round((item.value / total) * 100)}%`}
          >
            <i style={{ background: outcomeColors[item.key] }} aria-hidden="true" />
            <span>{OUTCOME_LABELS[item.key]}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
      <DataTable
        caption="Dati degli esiti"
        headers={["Esito", "Partite"]}
        rows={data.map((item) => [OUTCOME_LABELS[item.key], item.value])}
      />
    </div>
  );
}

export function TimelineChart({ data }: { data: HistoryDashboard["timeline"] }) {
  if (data.length < 2)
    return <ChartEmpty message="Servono almeno due periodi per mostrare un andamento sensato." />;
  const max = Math.max(...data.map((item) => item.played), 1);
  return (
    <div>
      <div className="timeline-bars" role="img" aria-label={`Attività in ${data.length} periodi`}>
        <div className="chart-y-label">Partite</div>
        {data.map((item) => (
          <div
            className="timeline-column"
            key={item.period}
            title={`${item.period}: ${item.played} partite`}
          >
            <div style={{ height: `${Math.max(8, (item.played / max) * 100)}%` }}>
              <span>{item.played}</span>
            </div>
            <time>
              {new Date(item.period).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "short",
              })}
            </time>
          </div>
        ))}
      </div>
      <div className="inline-legend">
        <span>
          <i className="pattern-solid" /> Partite disputate
        </span>
      </div>
      <DataTable
        caption="Attività per periodo"
        headers={["Settimana", "Partite", "Uscite regolari", "Ultimi posti"]}
        rows={data.map((item) => [item.period, item.played, item.finished, item.lost])}
      />
    </div>
  );
}

export function ActionChart({ data }: { data: HistoryDashboard["actions"] }) {
  if (!data.some((item) => item.value))
    return <ChartEmpty message="Le cattive intenzioni non sono ancora misurabili." />;
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div>
      <div className="action-bars" aria-label="Azioni di gioco">
        {data.map((item, index) => (
          <div
            key={item.key}
            className="action-bar"
            title={`${statisticLabel(item.key)}: ${item.value}`}
          >
            <span>{statisticLabel(item.key)}</span>
            <div>
              <i
                className={`bar-pattern pattern-${index % 3}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
              <strong>{item.value}</strong>
            </div>
          </div>
        ))}
      </div>
      <div className="inline-legend">
        <span>
          <i className="pattern-striped" /> Numero di azioni registrate
        </span>
      </div>
      <DataTable
        caption="Dati delle azioni"
        headers={["Azione", "Numero"]}
        rows={data.map((item) => [statisticLabel(item.key), item.value])}
      />
    </div>
  );
}

function ChartEmpty({ message = "Dati insufficienti per questo grafico." }: { message?: string }) {
  return <p className="chart-empty">{message}</p>;
}

function DataTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="sr-only chart-data-table">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
