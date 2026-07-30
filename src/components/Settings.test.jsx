import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Settings from "./Settings";

const renderSettings = (form, setForm = vi.fn()) =>
  render(<Settings closeModal={vi.fn()} form={form} setForm={setForm} />);

const baseForm = {
  notification: false,
  addTimeAmount: 1,
  showAddTimeAmount: true,
  showIdleTimer: true,
  wakeLock: false,
};

describe("Settings", () => {
  it("renders the 'Keep screen awake' Switch bound to form.wakeLock", () => {
    renderSettings({ ...baseForm, wakeLock: true });
    const label = screen.getByText("Keep screen awake");
    expect(label).toBeInTheDocument();
    // Switch renders a native <input type="checkbox"> (no aria-checked), so
    // assert via the `checked` property instead of aria-checked.
    const sw = label
      .closest("div")
      .querySelector("input, button, [role='switch']");
    expect(sw).toHaveProperty("checked", true);
  });

  it("toggling 'Keep screen awake' calls setForm with wakeLock: true", () => {
    const setForm = vi.fn();
    renderSettings(baseForm, setForm);
    const row = screen.getByText("Keep screen awake").closest("div");
    const sw = row.querySelector("[role='switch'], input[type='checkbox'], button");
    fireEvent.click(sw);
    expect(setForm).toHaveBeenCalledWith({ ...baseForm, wakeLock: true });
  });

  it("does NOT render the 'Sound' Setting field", () => {
    renderSettings(baseForm);
    expect(screen.queryByText("Sound")).not.toBeInTheDocument();
  });
});
