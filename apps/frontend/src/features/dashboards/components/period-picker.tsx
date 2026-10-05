import { Field, FieldLabel, Input, NativeSelect, NativeSelectOption } from "@repo/ui";
import type { StatPeriod, StatPeriodPreset } from "@repo/utils";

import { PERIOD_PRESETS, PERIOD_PRESET_LABELS } from "../period";

interface PeriodPickerProps {
  value: StatPeriod;
  onChange: (period: StatPeriod) => void;
}

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel htmlFor="widget-period">Period</FieldLabel>
        <NativeSelect
          id="widget-period"
          className="w-full"
          value={value.preset}
          onChange={(event) =>
            onChange({ ...value, preset: event.target.value as StatPeriodPreset })
          }
        >
          {PERIOD_PRESETS.map((preset) => (
            <NativeSelectOption key={preset} value={preset}>
              {PERIOD_PRESET_LABELS[preset]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      {value.preset === "CUSTOM" && (
        <div className="flex items-end gap-2">
          <Field className="min-w-0 flex-1">
            <FieldLabel htmlFor="widget-period-from" className="font-normal">
              From
            </FieldLabel>
            <Input
              id="widget-period-from"
              type="date"
              value={value.from ?? ""}
              max={value.to ?? undefined}
              onChange={(event) => onChange({ ...value, from: event.target.value || null })}
            />
          </Field>
          <Field className="min-w-0 flex-1">
            <FieldLabel htmlFor="widget-period-to" className="font-normal">
              To
            </FieldLabel>
            <Input
              id="widget-period-to"
              type="date"
              value={value.to ?? ""}
              min={value.from ?? undefined}
              onChange={(event) => onChange({ ...value, to: event.target.value || null })}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
