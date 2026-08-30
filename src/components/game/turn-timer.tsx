import { useCallback, useEffect, useRef, useState } from "react";

export function TurnTimer({ deadline, label = "Tempo del turno", compact = false }: { deadline: string | null; label?: string; compact?: boolean }) {
  const remaining = useCallback(() => deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)) : 0, [deadline]);
  const [seconds, setSeconds] = useState(remaining);
  const total = useRef(Math.max(remaining(), 1));
  useEffect(() => {
    total.current = Math.max(remaining(), 1);
    setSeconds(remaining());
    const interval = setInterval(() => setSeconds(remaining()), 500);
    return () => clearInterval(interval);
  }, [remaining]);
  const ratio = Math.min(1, seconds / total.current);
  const urgency = ratio <= .2 ? "critical" : ratio <= .45 ? "warning" : "safe";
  return <div className={`turn-timer ${urgency} ${compact ? "compact" : ""}`} role="timer" aria-label={`${seconds} secondi rimanenti`}>
    <div className="timer-copy"><span>{label}</span><strong>{seconds}s</strong></div>
    <div className="timer-track"><span className="timer-fill" style={{ transform: `scaleX(${ratio})` }} /></div>
  </div>;
}
