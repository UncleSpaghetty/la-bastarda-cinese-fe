import { useCallback, useEffect, useState } from "react";

export function TurnTimer({ deadline }: { deadline: string | null }) {
  const remaining = useCallback(() => deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)) : 0, [deadline]);
  const [seconds, setSeconds] = useState(remaining);
  useEffect(() => {
    setSeconds(remaining());
    const interval = setInterval(() => setSeconds(remaining()), 500);
    return () => clearInterval(interval);
  }, [remaining]);
  return <div className="timer" role="timer" aria-label={`${seconds} secondi rimanenti`}><span>{seconds}</span><small>secondi</small></div>;
}
