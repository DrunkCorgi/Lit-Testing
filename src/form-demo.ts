import { css, html, LitElement } from 'lit';
import { createDemoForm } from './demo-form';
import { ValidationController } from './validation-controller';
import './ds-text-input';
import type { DsTextInput } from './ds-text-input';

export class FormDemo extends LitElement {
  static properties = { submitted: { state: true }, result: { state: true } };
  readonly form = createDemoForm();
  private readonly validation = new ValidationController(this, this.form);
  private submitted = false;
  private result = '';

  static styles = css`
    :host { display: block; max-width: 1000px; margin: 0 auto; padding: 3rem 1.4rem; }
    .eyebrow { text-transform: uppercase; letter-spacing: .12em; font-size: .75rem; font-weight: 750; color: #38694f; }
    h1 { font-size: clamp(1.8rem, 5vw, 2.6rem); line-height: 1.15; margin: .6rem 0 1rem; }
    .intro { max-width: 65ch; color: #4a6054; }
    .layout { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 1.5rem; margin-top: 2rem; }
    form, aside { min-width: 0; background: #fff; border: 1px solid #d5dfd8; border-radius: 1rem; padding: 1.5rem; }
    fieldset { border: 0; margin: 0; padding: 0; min-width: 0; }
    legend { font-size: 1.2rem; font-weight: 700; padding: 0; }
    .hint { color: #52665b; margin: .4rem 0 1.5rem; font-size: .9rem; }
    .group-error { color: #a12231; min-height: 1.6em; font-size: .9rem; }
    .actions { display: flex; gap: .7rem; flex-wrap: wrap; margin-top: 1rem; }
    button { padding: .7rem 1rem; border-radius: .5rem; border: 1px solid #1f6246; background: #1f6246;
      color: white; font: inherit; font-weight: 650; cursor: pointer; }
    button.secondary { background: white; color: #1f6246; }
    button:focus-visible { outline: 3px solid #8cc6aa; outline-offset: 3px; }
    h2 { margin: 0 0 1rem; font-size: 1.1rem; }
    pre { background: #f4f7f4; border-radius: .5rem; padding: 1rem; overflow: auto; font-size: .8rem; }
    .success { color: #1f6246; font-weight: 600; }
    footer { margin-top: 1.5rem; font-size: .85rem; color: #52665b; }
    @media(max-width: 720px) { .layout { grid-template-columns: 1fr; } }
  `;

  private submit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted = true;
    this.result = '';
    this.validation.markAllAsTouched();
    if (!this.validation.validate()) {
      const group = this.form.controls.confirmation;
      const selector = !group.controls.text.valid ? '#first' : '#second';
      this.renderRoot.querySelector<DsTextInput>(selector)?.focus();
      return;
    }
    this.result = JSON.stringify(this.form.value, null, 2);
  }

  private resetForm(): void {
    this.validation.reset();
    this.submitted = false;
    this.result = '';
  }

  render() {
    const group = this.form.controls.confirmation;
    const showGroupError = this.submitted || (
      group.controls.text.touched && group.controls.repeat.touched
    );
    const state = {
      value: this.form.value,
      valid: this.form.valid,
      touched: this.form.touched,
      dirty: this.form.dirty,
      rootErrors: this.form.errors,
      groupErrors: group.errors,
    };

    return html`
      <header>
        <div class="eyebrow">Lit + TypeScript · Formularbeispiel</div>
        <h1>Zwei Felder. Eine gemeinsame Regel.</h1>
        <p class="intro">Beide Felder sind Pflichtfelder. Die verschachtelte Gruppe prüft zusätzlich,
          ob ihre Werte übereinstimmen. Rechts siehst du den aktuellen Modellzustand.</p>
      </header>
      <div class="layout">
        <form novalidate @submit=${this.submit} @reset=${this.resetForm}
          @input=${() => { this.result = ''; }}>
          <fieldset aria-describedby="hint group-error">
            <legend>Text bestätigen</legend>
            <p id="hint" class="hint">Gib zweimal denselben Text ein, zum Beispiel „Hallo“.</p>
            <ds-text-input id="first" label="Text"
              .control=${group.controls.text}></ds-text-input>
            <ds-text-input id="second" label="Text wiederholen"
              .control=${group.controls.repeat}></ds-text-input>
            <p id="group-error" class="group-error" aria-live="polite">
              ${showGroupError ? group.errors[0]?.message ?? '' : ''}
            </p>
          </fieldset>
          <div class="actions">
            <button type="submit">Prüfen & übernehmen</button>
            <button type="reset" class="secondary">Zurücksetzen</button>
          </div>
          <div aria-live="polite">
            ${this.result ? html`<p class="success">Gültig. Diese Werte würden übertragen:</p>
              <pre id="result">${this.result}</pre>` : ''}
          </div>
        </form>
        <aside aria-label="Live-Modellzustand">
          <h2>FormGroup → confirmation → Controls</h2>
          <pre id="state">${JSON.stringify(state, null, 2)}</pre>
          <p class="hint">Eine Gruppe kann wegen ihrer Kinder ungültig sein, obwohl ihre eigenen
            Fehler leer sind. Die Fehleranzeige erscheint erst nach Interaktion oder Absenden.</p>
        </aside>
      </div>
      <footer>Lokale Demo: Es werden keine Daten gesendet. Formularprüfung und Übernahme
        laufen ausdrücklich über das Modell; native FormData-Anbindung ist nicht Teil dieses Beispiels.</footer>
    `;
  }
}

customElements.define('form-demo', FormDemo);
