import { useEffect, useState } from "react";

import type { SettingsSection } from "../settings-shell";

/** Guards navigation while a settings section has unsaved changes. */
export function useProfileNavigationGuard() {
  const [active, setActive] = useState<SettingsSection>("profile");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  useEffect(() => {
    const guardLinks = (event: MouseEvent) => {
      if (!dirty) return;
      const link = (event.target as HTMLElement).closest("a[href]");
      if (link && !window.confirm("Hai modifiche non salvate. Vuoi uscire e scartarle?"))
        event.preventDefault();
    };
    document.addEventListener("click", guardLinks, true);
    return () => document.removeEventListener("click", guardLinks, true);
  }, [dirty]);

  const navigateSection = (next: SettingsSection) => {
    if (next === active) return;
    if (dirty && !window.confirm("Hai modifiche non salvate. Vuoi scartarle e cambiare sezione?"))
      return;
    setDirty(false);
    setActive(next);
  };

  return { active, dirty, setDirty, navigateSection };
}
