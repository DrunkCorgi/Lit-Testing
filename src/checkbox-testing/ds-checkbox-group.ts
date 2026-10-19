import { css, html, LitElement } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { FormControlMixin } from '../form-control-mixin';
import { FieldContentMixin } from './field-content-mixin';
import { checkboxStyles, renderCheckbox } from './checkbox-view';
import { toggleSelection, type CheckboxOption } from './selection';

/**
 * EIN Formularfeld mit einem Array als Wert. Kein FormGroup-Modell und keine
 * DsCheckbox-Kinder: Optionen verwenden nur das modellfreie Checkbox-Template.
 */
export class DsCheckboxGroup extends FormControlMixin<readonly string[]>()(FieldContentMixin(LitElement)) {
  static properties = {
    options: { attribute: false },
    disabled: { type: Boolean, reflect: true },
  };
  static styles = [checkboxStyles, css`
    fieldset { border: 0; margin: 0; padding: 0; min-width: 0; }
    legend { padding: 0; font-weight: 700; font-size: 1.1rem; }
    .options { display: grid; gap: 1rem; margin-top: 1.2rem; }
  `];

  options: readonly CheckboxOption[] = [];
  disabled = false;

  private toggle(option: CheckboxOption, checked: boolean): void {
    if (this.disabled || option.disabled || !this.control) return;
    this.control.setValue(toggleSelection(this.control.value, option.value, checked), { user: true });
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  private onFocusOut(event: FocusEvent): void {
    // Der Wechsel zwischen zwei Optionen ist KEIN Verlassen des Feldes.
    if (event.relatedTarget instanceof Node && this.renderRoot.contains(event.relatedTarget)) return;
    this.markAsTouched();
  }

  focus(options?: FocusOptions): void {
    this.renderRoot.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus(options);
  }

  render() {
    const description = [this.infoText ? 'group-info' : '', this.showErrors ? 'group-error' : '']
      .filter(Boolean).join(' ') || undefined;

    return html`
      <fieldset ?disabled=${this.disabled || !this.control}
        aria-describedby=${ifDefined(description)}
        aria-invalid=${ifDefined(this.showErrors ? 'true' : undefined)}
        @focusout=${this.onFocusOut}>
        <legend>${this.label}</legend>
        ${this.infoText ? html`<p id="group-info" class="info">${this.infoText}</p>` : ''}
        <div class="options">
          ${repeat(this.options, option => option.value, (option, index) => renderCheckbox({
            id: `option-${index}`, label: option.label, infoText: option.infoText,
            checked: this.control?.value.includes(option.value) ?? false,
            disabled: this.disabled || !!option.disabled || !this.control,
            describedBy: description,
            onToggle: checked => this.toggle(option, checked),
          }))}
        </div>
        <p id="group-error" class="error" aria-live="polite">
          ${this.showErrors ? this.validationErrors[0]?.message : ''}
        </p>
      </fieldset>
    `;
  }
}

customElements.define('ds-checkbox-group', DsCheckboxGroup);

declare global {
  interface HTMLElementTagNameMap { 'ds-checkbox-group': DsCheckboxGroup; }
}
