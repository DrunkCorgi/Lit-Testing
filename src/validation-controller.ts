import type { LitElement, ReactiveController } from 'lit';
import type { FormNode, ValidationError } from './form-model';

export type ValidationChange = Readonly<{
  valid: boolean;
  errors: readonly ValidationError[];
}>;

/** Lit adapter. The model remains the single owner of values and validation. */
export class ValidationController<T> implements ReactiveController {
  private readonly host: LitElement;
  private node?: FormNode<T>;
  private unsubscribe?: () => void;
  private connected = false;
  private previousValidation = '';

  constructor(host: LitElement, node?: FormNode<T>) {
    this.host = host;
    this.node = node;
    host.addController(this);
  }

  bind(node: FormNode<T> | undefined): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.node = node;
    if (this.connected) this.observe();
    this.host.requestUpdate();
  }

  hostConnected(): void {
    this.connected = true;
    this.observe();
    // Catch up with model changes that happened while the element was detached.
    this.host.requestUpdate();
  }

  hostDisconnected(): void {
    this.connected = false;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private snapshot(): ValidationChange {
    return { valid: this.node?.valid ?? true, errors: this.node?.errors ?? [] };
  }

  private observe(): void {
    this.unsubscribe?.();
    this.previousValidation = JSON.stringify(this.snapshot());
    this.unsubscribe = this.node?.subscribe(() => {
      this.host.requestUpdate();
      const detail = this.snapshot();
      const signature = JSON.stringify(detail);
      if (signature !== this.previousValidation) {
        this.previousValidation = signature;
        // Fires for changed validation results, including programmatic changes.
        // It is not used to synchronize the model tree.
        this.host.dispatchEvent(new CustomEvent<ValidationChange>('validation-change', {
          detail, bubbles: true, composed: true,
        }));
      }
    });
  }

  validate(): boolean { return this.node?.validate() ?? true; }
  markAllAsTouched(): void { this.node?.markAllAsTouched(); }
  reset(): void { this.node?.reset(); }
}
