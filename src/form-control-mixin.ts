import { LitElement, type PropertyDeclarations } from 'lit';
import type { FormControl, Validator } from './form-model';
import { ValidationController } from './validation-controller';

// The any[] constructor signature is the standard TypeScript mixin pattern.
type Constructor<T> = new (...args: any[]) => T;

export const FormControlMixin = <TValue>() =>
  <TBase extends Constructor<LitElement>>(Base: TBase) => {
    class FormControlElement extends Base {
      static properties: PropertyDeclarations = {
        // Custom accessor: bind synchronously rather than waiting for a render.
        control: { attribute: false, noAccessor: true },
        validators: { attribute: false, noAccessor: true },
      };

      private boundControl?: FormControl<TValue>;
      private readonly validation = new ValidationController<TValue>(this);

      get control(): FormControl<TValue> | undefined { return this.boundControl; }
      set control(next: FormControl<TValue> | undefined) {
        const previous = this.boundControl;
        if (previous === next) return;
        this.boundControl = next;
        this.validation.bind(next);
        this.requestUpdate('control', previous);
      }

      // Optional property facade. Rules live only in the bound model.
      // Bind .control first if you use this setter. The demo configures rules
      // directly on its models so validation also works before mounting the UI.
      get validators(): readonly Validator<TValue>[] {
        return this.control?.validators ?? [];
      }
      set validators(next: readonly Validator<TValue>[]) {
        if (!this.control) throw new Error('Bind control before setting validators.');
        const previous = this.control.validators;
        this.control.setValidators(next);
        this.requestUpdate('validators', previous);
      }

      get validationErrors() { return this.control?.errors ?? []; }
      get valid(): boolean { return this.control?.valid ?? true; }
      get showErrors(): boolean { return !!this.control?.touched && !this.valid; }

      validate(): boolean { return this.validation.validate(); }
      markAsTouched(): void { this.validation.markAllAsTouched(); }
      reset(): void { this.validation.reset(); }
    }

    return FormControlElement;
  };
