import { css, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';

export interface CheckboxViewOptions {
  id: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  infoText?: string;
  describedBy?: string;
  invalid?: boolean;
  onToggle: (checked: boolean) => void;
}

/**
 * Gemeinsamer, modellfreier Baustein für Einzelcheckbox UND Gruppenoptionen.
 * Das Template rendert im Shadow Root seines Besitzers. So bleiben Label,
 * Info und Fehler im gleichen DOM-Baum wie das native Input.
 * Kein FormControl, keine Validatoren, kein name/ElementInternals.
 */
export function renderCheckbox(options: CheckboxViewOptions) {
  const infoId = `${options.id}-info`;
  const description = [options.infoText ? infoId : '', options.describedBy]
    .filter(Boolean).join(' ') || undefined;

  return html`
    <div class="checkbox-row">
      <input id=${options.id} type="checkbox"
        .checked=${live(options.checked)} ?disabled=${options.disabled}
        aria-invalid=${ifDefined(options.invalid ? 'true' : undefined)}
        aria-describedby=${ifDefined(description)}
        @input=${(event: Event) => event.stopPropagation()}
        @change=${(event: Event) => {
          // Der Besitzer aktualisiert zuerst sein Modell und gibt dann genau
          // ein öffentliches input- und change-Event aus.
          event.stopPropagation();
          options.onToggle((event.target as HTMLInputElement).checked);
        }} />
      <div class="checkbox-copy">
        <label for=${options.id}>${options.label}</label>
        ${options.infoText ? html`<p id=${infoId} class="info">${options.infoText}</p>` : ''}
      </div>
    </div>
  `;
}

export const checkboxStyles = css`
  :host { display: block; color: #20322b; }
  .checkbox-row { display: flex; align-items: flex-start; gap: .7rem; }
  input[type=checkbox] { flex: 0 0 auto; width: 1.2rem; height: 1.2rem;
    margin: .2rem 0 0; accent-color: #226747; cursor: pointer; }
  input:focus-visible { outline: 3px solid #8cc6aa; outline-offset: 3px; }
  input:disabled { cursor: not-allowed; }
  input:disabled + .checkbox-copy { opacity: .65; }
  label { font-weight: 650; cursor: pointer; }
  .info { margin: .25rem 0 0; color: #52665b; font-size: .9rem; }
  .error { min-height: 1.5em; margin: .5rem 0 0; color: #a12231; font-size: .9rem; }
`;
