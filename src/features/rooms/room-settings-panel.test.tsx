import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import type { RoomPresetResponse, RoomSettingsInput } from "./api";
import { RoomSettingsPanel } from "./room-settings-panel";

const constraints = {
  turn_seconds: { min: 30, max: 180, step: 5 },
  warning_seconds: { min: 5, max: 30, step: 1 },
  max_consecutive_timeouts: { min: 1, max: 5, step: 1 },
  max_players: { min: 4, max: 10, step: 1 },
  max_spectators: { min: 0, max: 100, step: 1 },
  invite_expiry_hours: { min: 1, max: 720, step: 1 },
};
const shared = {
  max_players: 10,
  spectators_enabled: true,
  max_spectators: 20,
  invite_expiry_hours: 168,
};
const catalog: RoomPresetResponse = {
  default_preset_code: "NORMAL",
  presets: [
    {
      id: "fast",
      code: "FAST",
      label: "Veloce",
      description: "Rapida",
      is_custom: false,
      is_default: false,
      values: { ...shared, turn_seconds: 30, warning_seconds: 10, max_consecutive_timeouts: 2 },
      constraints,
    },
    {
      id: "normal",
      code: "NORMAL",
      label: "Normale",
      description: "Normale",
      is_custom: false,
      is_default: true,
      values: { ...shared, turn_seconds: 75, warning_seconds: 10, max_consecutive_timeouts: 3 },
      constraints,
    },
    {
      id: "relaxed",
      code: "RELAXED",
      label: "Rilassata",
      description: "Lenta",
      is_custom: false,
      is_default: false,
      values: { ...shared, turn_seconds: 120, warning_seconds: 10, max_consecutive_timeouts: 5 },
      constraints,
    },
    {
      id: "custom",
      code: "CUSTOM",
      label: "Personalizzata",
      description: "Custom",
      is_custom: true,
      is_default: false,
      values: { ...shared, turn_seconds: 75, warning_seconds: 10, max_consecutive_timeouts: 3 },
      constraints,
    },
  ],
};
const initial: RoomSettingsInput = { preset: "NORMAL", ...catalog.presets[1].values };
function Harness() {
  const [value, setValue] = useState(initial);
  return (
    <RoomSettingsPanel
      catalog={catalog}
      isLoading={false}
      isError={false}
      value={value}
      isSaving={false}
      onChange={setValue}
      onSubmit={() => undefined}
    />
  );
}
test("selects API presets and preserves editable custom values", async () => {
  render(<Harness />);
  expect(screen.getByRole("radio", { name: /normale/i })).toHaveAttribute("aria-checked", "true");
  fireEvent.click(screen.getByRole("radio", { name: /personalizzata/i }));
  fireEvent.change(screen.getByRole("spinbutton", { name: /durata del turno/i }), {
    target: { value: "95" },
  });
  fireEvent.click(screen.getByRole("radio", { name: /veloce/i }));
  await waitFor(() =>
    expect(screen.queryByRole("spinbutton", { name: /durata del turno/i })).not.toBeInTheDocument()
  );
  fireEvent.click(screen.getByRole("radio", { name: /personalizzata/i }));
  expect(screen.getByRole("spinbutton", { name: /durata del turno/i })).toHaveValue(95);
});
test("uses backend constraints and disables spectator capacity", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("radio", { name: /personalizzata/i }));
  fireEvent.click(screen.getByRole("checkbox", { name: /consenti spectator/i }));
  expect(screen.getByRole("spinbutton", { name: /spectator massimi/i })).toBeDisabled();
  fireEvent.change(screen.getByRole("spinbutton", { name: /durata del turno/i }), {
    target: { value: "200" },
  });
  expect(screen.getByText(/usa un valore tra 30 e 180/i)).toBeInTheDocument();
});
test("submits the effective API preset and explains catalog failures", () => {
  let submitted: RoomSettingsInput | undefined;
  function SubmitHarness() {
    const [value, setValue] = useState(initial);
    return (
      <RoomSettingsPanel
        catalog={catalog}
        isLoading={false}
        isError={false}
        value={value}
        isSaving={false}
        onChange={setValue}
        onSubmit={() => {
          submitted = value;
        }}
      />
    );
  }
  const { rerender } = render(<SubmitHarness />);
  fireEvent.click(screen.getByRole("radio", { name: /veloce/i }));
  fireEvent.click(screen.getByRole("button", { name: /salva configurazione/i }));
  expect(submitted).toMatchObject({
    preset: "FAST",
    turn_seconds: 30,
    max_consecutive_timeouts: 2,
  });
  rerender(
    <RoomSettingsPanel
      isLoading={false}
      isError
      value={initial}
      isSaving={false}
      onChange={() => undefined}
      onSubmit={() => undefined}
    />
  );
  expect(screen.getByRole("alert")).toHaveTextContent(/preset non disponibili/i);
});
