"use client";

import { PO_STATUSES, STATUS_LABELS, type PoStatus } from "@/lib/mrp";

type Action = (formData: FormData) => void | Promise<void>;

export default function StatusSelect({
  action,
  poId,
  value,
  color,
  background,
  border,
}: {
  action: Action;
  poId: string;
  value: PoStatus;
  color: string;
  background: string;
  border: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="poId" value={poId} />
      <select
        // React 19 resets an uncontrolled form once its action resolves, which
        // snapped the select back to the value it mounted with. Keying on the
        // server value remounts it instead, so the saved status sticks.
        key={value}
        name="status"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="PO status"
        style={{
          padding: "4px 10px",
          fontSize: 14.3,
          fontWeight: 600,
          color,
          background,
          border: `1px solid ${border}`,
          cursor: "pointer",
        }}
      >
        {PO_STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
    </form>
  );
}
