import { useEffect, useMemo, useState } from "react";

/** Select with an "Other" choice that reveals a free-text input. */
export function SelectOrOther({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
}) {
  const presets = useMemo(() => options.filter((o) => o !== "Other"), [options]);
  const opts = useMemo(() => [...presets, "Other"], [presets]);
  const valueIsPreset = presets.includes(value);
  const [pickingOther, setPickingOther] = useState(() => Boolean(value) && !valueIsPreset);

  useEffect(() => {
    if (value && !presets.includes(value)) setPickingOther(true);
    else if (value && presets.includes(value)) setPickingOther(false);
  }, [value, presets]);

  const selectValue = pickingOther ? "Other" : valueIsPreset ? value : "";

  return (
    <label className={className ?? "block text-sm font-semibold"}>
      {label}
      <select
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "Other") {
            setPickingOther(true);
            if (valueIsPreset || !value) onChange("");
          } else {
            setPickingOther(false);
            onChange(next);
          }
        }}
        className="mt-1 w-full rounded-md border bg-background px-3 py-2.5 text-base md:text-sm"
      >
        <option value="">Select…</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {pickingOther && (
        <input
          value={valueIsPreset ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Specify ${label.toLowerCase()}`}
          className="mt-2 w-full rounded-md border px-3 py-2.5 text-base md:text-sm"
        />
      )}
    </label>
  );
}
