import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { SettingsShell } from "./settings-shell";
import type { SettingsSection } from "./settings-shell";
function Harness() {
  const [active, setActive] = useState<SettingsSection>("profile");
  return (
    <SettingsShell active={active} dirty={false} onNavigate={setActive}>
      <p>Contenuto</p>
    </SettingsShell>
  );
}
test("offers hierarchical desktop and mobile settings navigation", () => {
  render(<Harness />);
  expect(screen.getByRole("button", { name: /profilo pubblico/i })).toHaveAttribute(
    "aria-current",
    "page"
  );
  fireEvent.click(screen.getByRole("button", { name: /privacy e dati/i }));
  expect(screen.getByRole("heading", { name: /privacy e dati/i })).toHaveFocus();
  expect(screen.getByRole("combobox", { name: /sezione/i })).toHaveValue("privacy");
  expect(screen.queryByRole("tab")).not.toBeInTheDocument();
});
