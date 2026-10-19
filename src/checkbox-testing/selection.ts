export type CheckboxOption = Readonly<{
  value: string;
  label: string;
  infoText?: string;
  disabled?: boolean;
}>;

/** Neue Array-Referenz; keine Mutation des bisherigen Feldwertes. */
export function toggleSelection(
  current: readonly string[], value: string, checked: boolean,
): readonly string[] {
  return checked
    ? [...new Set([...current, value])]
    : current.filter(selected => selected !== value);
}
