import { Gamepad2, LockKeyhole, Shield, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";

export const SETTINGS_SECTIONS = [
  {
    id: "profile",
    label: "Profilo pubblico",
    description: "Quello che gli altri vedranno prima di accusarti.",
    icon: UserRound,
  },
  {
    id: "identity",
    label: "Identità e accesso",
    description: "Le chiavi del covo. Cerca di non perderle.",
    icon: LockKeyhole,
  },
  {
    id: "preferences",
    label: "Preferenze di gioco",
    description: "Come vuoi presentarti quando iniziano le cattive decisioni.",
    icon: Gamepad2,
  },
  {
    id: "privacy",
    label: "Privacy e dati",
    description: "Scegli cosa conservare. Il rancore non è incluso.",
    icon: Shield,
  },
] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]["id"];

export function SettingsShell({
  active,
  dirty,
  onNavigate,
  children,
}: {
  active: SettingsSection;
  dirty: boolean;
  onNavigate: (section: SettingsSection) => void;
  children: React.ReactNode;
}) {
  const current = SETTINGS_SECTIONS.find((section) => section.id === active)!;
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, [active]);
  return (
    <div className="settings-shell">
      <aside className="settings-nav" aria-label="Sezioni account">
        {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={active === id ? "is-active" : ""}
            type="button"
            aria-current={active === id ? "page" : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
            {dirty && active === id && <i aria-label="Modifiche non salvate" />}
          </button>
        ))}
      </aside>
      <label className="settings-mobile-nav">
        Sezione
        <select
          value={active}
          onChange={(event) => onNavigate(event.target.value as SettingsSection)}
        >
          {SETTINGS_SECTIONS.map((section) => (
            <option key={section.id} value={section.id}>
              {section.label}
            </option>
          ))}
        </select>
      </label>
      <div className="settings-content">
        <header>
          <h2 ref={titleRef} tabIndex={-1}>
            {current.label}
          </h2>
          <p>{current.description}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
