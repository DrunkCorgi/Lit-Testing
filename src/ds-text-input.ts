import { css, html, LitElement } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { FormControlMixin } from './form-control-mixin';

export class DsTextInput extends FormControlMixin<string>()(LitElement) {
  static properties = { label: { type: String } };
  label = '';

  static styles = css`
    :host { display: block; }
    label { display: block; font-weight: 650; margin-bottom: .4rem; }
    input { box-sizing: border-box; width: 100%; padding: .8rem; border: 1px solid #899c92;
      border-radius: .5rem; background: white; color: #20322b; font: inherit; }
    input:focus-visible { outline: 3px solid #8cc6aa; outline-offset: 2px; }
    input[aria-invalid=true] { border-color: #ac2635; }
    .error { min-height: 1.5em; margin: .35rem 0 0; color: #a12231; font-size: .9rem; }
  `;

  private onInput(event: Event): void {
    this.control?.setValue((event.target as HTMLInputElement).value, { user: true });
    // The native input event already bubbles across this shadow root.
  }

  private onChange(event: Event): void {
    event.stopPropagation();
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  focus(options?: FocusOptions): void {
    this.renderRoot.querySelector<HTMLInputElement>('input')?.focus(options);
  }

  render() {
    return html`
      <label for="input">${this.label}</label>
      <input id="input" type="text" autocomplete="off" spellcheck="false"
        .value=${live(this.control?.value ?? '')}
        aria-invalid=${this.showErrors ? 'true' : 'false'}
        aria-describedby=${ifDefined(this.showErrors ? 'error' : undefined)}
        @input=${this.onInput} @change=${this.onChange}
        @blur=${() => this.markAsTouched()} />
      <p id="error" class="error" aria-live="polite">
        ${this.showErrors ? this.validationErrors[0]?.message : ''}
      </p>
    `;
  }
}

customElements.define('ds-text-input', DsTextInput);
