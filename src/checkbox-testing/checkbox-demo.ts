import { css, html, LitElement } from 'lit';
import { ValidationController } from '../validation-controller';
import { createCheckboxForm } from './checkbox-form';
import type { CheckboxOption } from './selection';
import './ds-checkbox';
import './ds-checkbox-group';

export class CheckboxDemo extends LitElement {
  static properties = { result: { state: true } };
  readonly form = createCheckboxForm();
  private readonly validation = new ValidationController(this, this.form);
  private result = '';
  private readonly options: readonly CheckboxOption[] = [
    { value: 'email', label: 'E-Mail', infoText: 'Nachrichten direkt in dein Postfach.' },
    { value: 'phone', label: 'Telefon' },
    { value: 'sms', label: 'SMS' },
    { value: 'letter', label: 'Brief', infoText: 'Derzeit nicht verfügbar.', disabled: true },
  ];

  static styles = css`
    :host { display: block; max-width: 1080px; margin: auto; padding: 2.5rem 1.4rem; }
    a { color: #226747; }
    .eyebrow { text-transform: uppercase; letter-spacing: .12em; font-size: .75rem; font-weight: 750; color: #38694f; }
    h1 { font-size: clamp(1.8rem, 5vw, 2.5rem); line-height: 1.2; margin: .7rem 0 1rem; }
    .intro { max-width: 70ch; color: #52665b; }
    .layout { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 1.5rem; margin: 2rem 0; align-items: start; }
    form { min-width: 0; }
    section, aside { min-width: 0; border: 1px solid #d5dfd8; border-radius: 1rem; padding: 1.5rem; background: white; }
    section + section { margin-top: 1rem; }
    h2 { margin: 0 0 1rem; font-size: 1.1rem; }
    .badge { margin: 0 0 .9rem; color: #52665b; font-size: .8rem; }
    pre { padding: 1rem; background: #f4f7f4; border-radius: .5rem; overflow: auto; font-size: .8rem; }
    .actions { display: flex; gap: .6rem; flex-wrap: wrap; margin: 1.25rem 0; }
    button { border: 1px solid #226747; border-radius: .5rem; padding: .7rem 1rem; font: inherit;
      font-weight: 650; color: white; background: #226747; cursor: pointer; }
    button.secondary { color: #226747; background: white; }
    button:focus-visible { outline: 3px solid #8cc6aa; outline-offset: 3px; }
    .hint, footer { color: #52665b; font-size: .9rem; }
    .success { color: #226747; font-weight: 650; }
    @media(max-width: 760px) { .layout { grid-template-columns: minmax(0, 1fr); } }
  `;

  private submit(event: SubmitEvent): void {
    event.preventDefault();
    this.result = '';
    this.validation.markAllAsTouched();
    if (!this.validation.validate()) {
      if (!this.form.controls.consent.valid) this.renderRoot.querySelector('ds-checkbox')?.focus();
      else this.renderRoot.querySelector('ds-checkbox-group')?.focus();
      return;
    }
    this.result = JSON.stringify(this.form.value, null, 2);
  }

  private resetForm(): void {
    this.validation.reset();
    this.result = '';
  }

  private preset(): void {
    this.result = '';
    this.form.controls.consent.setValue(true);
    this.form.controls.channels.setValue(['email', 'phone']);
  }

  render() {
    const { consent, channels } = this.form.controls;
    const state = {
      value: this.form.value, valid: this.form.valid,
      consent: { errors: consent.errors, touched: consent.touched, dirty: consent.dirty },
      channels: { errors: channels.errors, touched: channels.touched, dirty: channels.dirty },
    };

    return html`
      <header>
        <a href="/">← Zum Textinput-Beispiel</a>
        <p class="eyebrow">Checkbox Testing · Lit + TypeScript</p>
        <h1>Ein Baustein. Zwei Arten von Formularfeldern.</h1>
        <p class="intro">Die Einzelcheckbox besitzt einen booleschen Feldwert. Die Checkbox-Gruppe
          besitzt ein gemeinsames Array. Ihre Optionen verwenden nur Darstellung und Bedienung.</p>
      </header>
      <div class="layout">
        <form novalidate @submit=${this.submit} @reset=${this.resetForm}
          @input=${() => { this.result = ''; }}>
          <section aria-labelledby="single-title">
            <h2 id="single-title">Einzelne Checkbox</h2>
            <p class="badge">Ein FormControl&lt;boolean&gt;</p>
            <ds-checkbox label="Ich nehme teil"
              info-text="Diese Bestätigung ist erforderlich."
              .control=${consent}></ds-checkbox>
          </section>
          <section aria-label="Checkbox-Gruppe">
            <p class="badge">Ein FormControl&lt;readonly string[]&gt; für die gesamte Auswahl</p>
            <ds-checkbox-group label="Kontaktwege"
              info-text="Wähle mindestens zwei Kontaktwege."
              .options=${this.options} .control=${channels}></ds-checkbox-group>
          </section>
          <div class="actions">
            <button type="submit">Prüfen</button>
            <button type="reset" class="secondary">Zurücksetzen</button>
            <button type="button" class="secondary" @click=${this.preset}>Beispielwerte setzen</button>
          </div>
          <div aria-live="polite">
            ${this.result ? html`<p class="success">Gültig. Übernommene Werte:</p>
              <pre id="result">${this.result}</pre>` : ''}
          </div>
        </form>
        <aside aria-label="Formularmodell">
          <h2>Genau zwei Formularfelder</h2>
          <pre id="state">${JSON.stringify(state, null, 2)}</pre>
          <p class="hint">Keine eigenen FormControls für E-Mail, Telefon, SMS oder Brief.
            Die Auswahlregel und die Fehlermeldung gehören zur Gruppe.</p>
          <p class="hint">Beim Wechsel zwischen Optionen bleibt die Gruppe unberührt.
            Erst beim Verlassen wird sie als „touched“ markiert.</p>
        </aside>
      </div>
      <footer>Lokale Demo ohne Datenübertragung. Die Formularprüfung erfolgt über das Modell.
        Native FormData- und ElementInternals-Anbindung sind hier nicht enthalten.</footer>
    `;
  }
}

customElements.define('checkbox-demo', CheckboxDemo);
