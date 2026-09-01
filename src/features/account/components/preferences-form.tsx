import { apiErrorMessage } from "@/lib/api/client";
import { usePreferencesForm } from "../hooks/use-preferences-form";
import type { Profile } from "../hooks/use-profile-query";

type Props = { profile: Profile; onSaved: () => void; onDirty: (dirty: boolean) => void };

const toggleLabels: Record<string, string> = {
  confirm_collect: "Conferma prima di raccogliere",
  reduce_motion: "Riduci le animazioni",
  auto_open_history: "Apri automaticamente la cronologia",
  spectator_enabled: "Proponi il ruolo spectator",
};

export function PreferencesForm({ profile, onSaved, onDirty }: Props) {
  const form = usePreferencesForm(profile, onSaved, onDirty);
  const toggle = (key: keyof typeof form.values) =>
    key === "effects_volume" ? null : (
      <label className="preference-row" key={key}>
        <span>
          <strong>{toggleLabels[key]}</strong>
        </span>
        <input
          type="checkbox"
          checked={Boolean(form.values[key])}
          onChange={(event) => form.setValues({ ...form.values, [key]: event.target.checked })}
        />
      </label>
    );

  return (
    <form
      className="section-form"
      onSubmit={(event) => {
        event.preventDefault();
        form.save.mutate();
      }}
    >
      {toggle("confirm_collect")}
      {toggle("reduce_motion")} {toggle("auto_open_history")}
      {toggle("spectator_enabled")}
      <label>
        Volume degli effetti <output>{form.values.effects_volume}%</output>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={form.values.effects_volume}
          onChange={(event) =>
            form.setValues({ ...form.values, effects_volume: Number(event.target.value) })
          }
        />
      </label>
      {form.save.isError && (
        <p className="field-error" role="alert">
          {apiErrorMessage(form.save.error, "Preferenze non salvate.")}
        </p>
      )}
      {form.message && (
        <p className="form-success" role="status">
          {form.message}
        </p>
      )}
      <div className="form-actions">
        <button className="button button-primary" disabled={!form.dirty || form.save.isPending}>
          Salva preferenze
        </button>
      </div>
    </form>
  );
}
