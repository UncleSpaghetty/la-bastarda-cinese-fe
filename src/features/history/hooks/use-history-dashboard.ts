import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import { getHistoryDashboard } from "../api";

/** Query state and filter helpers powering the history dashboard page. */
export function useHistoryDashboard() {
  const [params, setParams] = useSearchParams();
  if (!params.has("range")) params.set("range", "10");
  const history = useQuery({
    queryKey: ["history-dashboard", params.toString()],
    queryFn: () => getHistoryDashboard(params),
  });
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return { history, params, update };
}
