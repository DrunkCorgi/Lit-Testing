import { FormControl, FormGroup, type Validator } from './form-model.ts';

export const required: Validator<string> = (value) =>
  value.trim() ? null : { code: 'required', message: 'Bitte ausfüllen.' };

export function createDemoForm() {
  const confirmation = new FormGroup({
    text: new FormControl<string>('', [required]),
    repeat: new FormControl<string>('', [required]),
  }, [
    ({ text, repeat }) => {
      // Empty fields have their own error. Avoid a second, redundant message.
      if (!text.trim() || !repeat.trim()) return null;
      return text === repeat ? null : {
        code: 'mismatch',
        message: 'Die beiden Eingaben müssen übereinstimmen.',
      };
    },
  ]);

  // Actual nesting: root group -> confirmation group -> two leaf controls.
  return new FormGroup({ confirmation });
}
