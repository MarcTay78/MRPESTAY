"use client";

import { useRef } from "react";

type Action = (formData: FormData) => void | Promise<void>;

// Native date inputs render in the browser's locale, which is mm/dd/yyyy on a
// US-configured machine. So the visible control is our own button showing
// dd/mm/yyyy, and the real input sits behind it invisible, opened via
// showPicker() and still carrying the value on submit.
function display(value: string | null) {
  if (!value) return "dd/mm/yyyy";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

export default function DateField({
  action,
  hidden,
  value,
  editable,
  clearable = true,
}: {
  action: Action;
  hidden: Record<string, string>;
  value: string | null;
  editable: boolean;
  clearable?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      // Older browsers, or a picker blocked outside a user gesture.
      el.focus();
    }
  };

  return (
    <form action={action} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <span style={{ position: "relative", display: "inline-flex", width: 168 }}>
        <button
          type="button"
          className="input"
          disabled={!editable}
          onClick={openPicker}
          aria-label={value ? `Change date, currently ${display(value)}` : "Set date"}
          style={{
            fontSize: 15.6,
            padding: "4px 6px",
            minHeight: 28,
            width: "100%",
            textAlign: "left",
            cursor: editable ? "pointer" : "not-allowed",
            color: value ? "var(--color-text)" : "var(--color-neutral-500)",
          }}
        >
          {display(value)}
        </button>
        <input
          key={value ?? "empty"}
          ref={inputRef}
          type="date"
          name="value"
          defaultValue={value ?? ""}
          disabled={!editable}
          tabIndex={-1}
          aria-hidden
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 1, opacity: 0, pointerEvents: "none", border: 0, padding: 0 }}
        />
      </span>
      {editable && clearable && value && (
        <button
          type="button"
          className="btn btn-ghost"
          title="Clear date"
          aria-label="Clear date"
          style={{ width: 22, height: 22, minHeight: 0, padding: 0, fontSize: 18.2, lineHeight: 1 }}
          onClick={(e) => {
            const form = e.currentTarget.form;
            const input = form?.querySelector<HTMLInputElement>('input[type="date"]');
            if (input) input.value = "";
            form?.requestSubmit();
          }}
        >
          ×
        </button>
      )}
    </form>
  );
}
