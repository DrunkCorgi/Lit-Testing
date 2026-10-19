import { html, LitElement } from 'lit';
import { FormControlMixin } from '../form-control-mixin';
import { FieldContentMixin } from './field-content-mixin';
import { checkboxStyles, renderCheckbox } from './checkbox-view';

/** Vollständiges einzelnes Formularfeld: ein FormControl<boolean>. */
export class DsCheckbox extends FormControlMixin<boolean>()(FieldContentMixin(LitElement)) {
  static properties = { disabled: { type: Boolean, reflect: true } };
  static styles = checkboxStyles;
  disabled = false;

  private toggle(checked: boolean): void {
    if (this.disabled || !this.control) return;
    this.control.setValue(checked, { user: true });
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  focus(options?: FocusOptions): void {
    this.renderRoot.querySelector<HTMLInputElement>('input')?.focus(options);
  }

  render() {
    return html`
      <div @focusout=${() => this.markAsTouched()}>
        ${renderCheckbox({
          id: 'checkbox', label: this.label, infoText: this.infoText,
          checked: this.control?.value ?? false,
          disabled: this.disabled || !this.control,
          invalid: this.showErrors,
          describedBy: this.showErrors ? 'field-error' : undefined,
          onToggle: checked => this.toggle(checked),
        })}
      </div>
      <p id="field-error" class="error" aria-live="polite">
        ${this.showErrors ? this.validationErrors[0]?.message : ''}
      </p>
    `;
  }
}

customElements.define('ds-checkbox', DsCheckbox);

declare global {
  interface HTMLElementTagNameMap { 'ds-checkbox': DsCheckbox; }
}
