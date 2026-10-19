import { FormControl, FormGroup, type Validator } from '../form-model.ts';

export const mustBeChecked: Validator<boolean> = checked => checked ? null : {
  code: 'required', message: 'Bitte bestätige die Teilnahme.',
};

export const atLeastTwo: Validator<readonly string[]> = selected =>
  new Set(selected).size >= 2 ? null : {
    code: 'min-selection', message: 'Bitte wähle mindestens zwei Kontaktwege.',
  };

export function createCheckboxForm() {
  return new FormGroup({
    consent: new FormControl<boolean>(false, [mustBeChecked]),
    // Die Checkbox-Gruppe ist EIN Feld. Ihre Optionen sind keine Kind-Controls.
    channels: new FormControl<readonly string[]>([], [atLeastTwo]),
  });
}
