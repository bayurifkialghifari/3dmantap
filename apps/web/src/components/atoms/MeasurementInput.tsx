import { useState, useEffect } from 'react';
import { Field, Input } from './ui';
export function MeasurementInput({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft);
    const next = Number.isFinite(n) && draft.trim() ? Math.max(min, Math.min(max, n)) : value;
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };
  return (
    <Field label={label}>
      <Input
        type="number"
        min={min}
        max={max}
        step={0.1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </Field>
  );
}
