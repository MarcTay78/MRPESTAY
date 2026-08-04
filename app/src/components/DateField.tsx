"use client";

type Action = (formData: FormData) => void | Promise<void>;

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
  return (
    <form action={action} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input
        key={value ?? "empty"}
        className="input"
        type="date"
        name="value"
        defaultValue={value ?? ""}
        disabled={!editable}
        style={{ fontSize: 15.6, padding: "4px 6px", minHeight: 28, width: 168 }}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      />
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
