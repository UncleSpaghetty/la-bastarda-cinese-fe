import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Clock3, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import type { RoomPreset, RoomPresetResponse, RoomSettingsInput } from "./api";

type Props = {
  catalog?: RoomPresetResponse;
  isLoading: boolean;
  isError: boolean;
  value: RoomSettingsInput;
  isSaving: boolean;
  onChange: (value: RoomSettingsInput) => void;
  onSubmit: () => void;
};

const fieldLabels: Partial<Record<keyof RoomSettingsInput, string>> = {
  turn_seconds: "Durata del turno",
  warning_seconds: "Durata dell’avviso",
  max_consecutive_timeouts: "Timeout consecutivi",
  max_players: "Giocatori massimi",
  max_spectators: "Spectator massimi",
  invite_expiry_hours: "Scadenza invito",
};

function seconds(value: number) {
  return `${value} s`;
}

export function RoomSettingsPanel({
  catalog,
  isLoading,
  isError,
  value,
  isSaving,
  onChange,
  onSubmit,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const customMemory = useRef<RoomSettingsInput | null>(value.preset === "CUSTOM" ? value : null);
  const customTitle = useRef<HTMLHeadingElement>(null);
  const keyboardOpened = useRef(false);
  const presets = catalog?.presets ?? [];
  const selected = presets.find((preset) => preset.code === value.preset);
  const constraints =
    selected?.constraints ?? presets.find((preset) => preset.is_custom)?.constraints ?? {};

  useEffect(() => {
    if (value.preset === "CUSTOM" && keyboardOpened.current) {
      customTitle.current?.focus();
      keyboardOpened.current = false;
    }
  }, [value.preset]);

  const validate = (next: RoomSettingsInput) => {
    const nextErrors: Record<string, string> = {};
    Object.entries(constraints).forEach(([field, limit]) => {
      const numeric = next[field as keyof RoomSettingsInput];
      if (typeof numeric === "number" && (numeric < limit.min || numeric > limit.max)) {
        nextErrors[field] =
          `${fieldLabels[field as keyof RoomSettingsInput]}: usa un valore tra ${limit.min} e ${limit.max}.`;
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const change = (next: RoomSettingsInput) => {
    if (next.preset === "CUSTOM") customMemory.current = next;
    validate(next);
    onChange(next);
  };
  const choose = (preset: RoomPreset) => {
    setErrors({});
    if (preset.is_custom) {
      change(customMemory.current ?? { preset: preset.code, ...preset.values });
    } else {
      if (value.preset === "CUSTOM") customMemory.current = value;
      onChange({ preset: preset.code, ...preset.values });
    }
  };
  const numericField = (field: keyof RoomSettingsInput, unit: string, help: string) => {
    const limit = constraints[field as keyof typeof constraints];
    const disabled = field === "max_spectators" && !value.spectators_enabled;
    return (
      <label className={`setting-field ${disabled ? "is-disabled" : ""}`}>
        <span>{fieldLabels[field]}</span>
        <small>{help}</small>
        <div className="number-with-unit">
          <input
            name={field}
            type="number"
            value={String(value[field])}
            min={limit?.min}
            max={limit?.max}
            step={limit?.step}
            disabled={disabled}
            aria-invalid={Boolean(errors[field])}
            aria-describedby={`${field}-help ${errors[field] ? `${field}-error` : ""}`}
            onChange={(event) =>
              change({ ...value, preset: "CUSTOM", [field]: Number(event.target.value) })
            }
          />
          <span>{unit}</span>
        </div>
        <span id={`${field}-help`} className="sr-only">
          {help}
        </span>
        {errors[field] && (
          <span id={`${field}-error`} className="field-error">
            {errors[field]}
          </span>
        )}
      </label>
    );
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (validate(value)) onSubmit();
  };

  if (isLoading)
    return (
      <div className="settings-skeleton" aria-label="Caricamento preset">
        <span />
        <span />
        <span />
        <span />
      </div>
    );
  if (isError || !catalog)
    return (
      <div className="preset-error" role="alert">
        <strong>Preset non disponibili.</strong>
        <p>
          La configurazione della stanza non può essere modificata ora. Riprova ricaricando la
          pagina.
        </p>
      </div>
    );

  return (
    <form className="settings-form" onSubmit={submit}>
      <div className="preset-grid" role="radiogroup" aria-label="Ritmo della partita">
        {presets.map((preset) => (
          <button
            key={preset.id}
            className={`preset-card ${value.preset === preset.code ? "is-selected" : ""}`}
            role="radio"
            aria-checked={value.preset === preset.code}
            aria-expanded={preset.is_custom ? value.preset === "CUSTOM" : undefined}
            type="button"
            onKeyDown={(event) => {
              if (preset.is_custom && (event.key === "Enter" || event.key === " "))
                keyboardOpened.current = true;
            }}
            onClick={() => choose(preset)}
          >
            <span className="preset-check">
              <Check aria-hidden="true" />
            </span>
            <strong>{preset.label}</strong>
            <p>{preset.description}</p>
            <span className="preset-facts">
              <span>
                <Clock3 aria-hidden="true" /> {seconds(preset.values.turn_seconds)}
              </span>
              <span>{preset.values.max_consecutive_timeouts} timeout</span>
              {preset.values.warning_seconds ? (
                <span>avviso {seconds(preset.values.warning_seconds)}</span>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      {selected && !selected.is_custom && (
        <div className="preset-summary" aria-live="polite">
          <strong>{selected.label} è pronto a fare danni.</strong>
          <p>
            Turni da {seconds(value.turn_seconds)}, avviso negli ultimi{" "}
            {seconds(value.warning_seconds)} e ritiro dopo {value.max_consecutive_timeouts} timeout
            consecutivi.
          </p>
          <span>
            <Users aria-hidden="true" /> Fino a {value.max_players} giocatori ·{" "}
            {value.spectators_enabled
              ? `${value.max_spectators} spectator`
              : "spectator disattivati"}
          </span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {value.preset === "CUSTOM" && (
          <motion.div
            className="custom-settings"
            initial={reducedMotion ? false : { height: 0, opacity: 0, y: -8 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={reducedMotion ? { display: "none" } : { height: 0, opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0 : 0.22 }}
            aria-live="polite"
          >
            <h3 ref={customTitle} tabIndex={-1}>
              Personalizza il tavolo
            </h3>
            <p>Queste scelte cambiano il ritmo, non le regole delle carte.</p>
            <motion.div
              className="custom-groups"
              initial={reducedMotion ? false : "hidden"}
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: reducedMotion ? 0 : 0.055 } } }}
            >
              {[
                <fieldset key="pace">
                  <legend>1. Ritmo della partita</legend>
                  {numericField("turn_seconds", "secondi", "Tempo disponibile per ogni turno.")}
                  {numericField("warning_seconds", "secondi", "Quando mostrare l’avviso finale.")}
                </fieldset>,
                <fieldset key="timeout">
                  <legend>2. Timeout</legend>
                  {numericField(
                    "max_consecutive_timeouts",
                    "timeout",
                    "Dopo questa soglia il giocatore viene ritirato."
                  )}
                </fieldset>,
                <fieldset key="people">
                  <legend>3. Partecipanti</legend>
                  {numericField(
                    "max_players",
                    "giocatori",
                    "Capienza del tavolo, da quattro al limite globale."
                  )}
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={value.spectators_enabled}
                      onChange={(event) =>
                        change({
                          ...value,
                          preset: "CUSTOM",
                          spectators_enabled: event.target.checked,
                        })
                      }
                    />{" "}
                    Consenti spectator
                  </label>
                  {numericField("max_spectators", "spectator", "Posti disponibili per chi guarda.")}
                </fieldset>,
                <fieldset key="invite">
                  <legend>4. Invito</legend>
                  {numericField(
                    "invite_expiry_hours",
                    "ore",
                    "Durata del link prima della scadenza."
                  )}
                </fieldset>,
              ].map((group) => (
                <motion.div
                  key={group.key}
                  variants={
                    reducedMotion
                      ? undefined
                      : { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }
                  }
                >
                  {group}
                </motion.div>
              ))}
            </motion.div>
            <div className="preset-summary">
              <strong>Il tuo ritmo</strong>
              <p>
                {seconds(value.turn_seconds)} a turno · avviso a {seconds(value.warning_seconds)} ·
                ritiro dopo {value.max_consecutive_timeouts} timeout.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        className="button button-primary settings-save"
        disabled={isSaving || Object.keys(errors).length > 0}
      >
        Salva configurazione
      </button>
    </form>
  );
}
