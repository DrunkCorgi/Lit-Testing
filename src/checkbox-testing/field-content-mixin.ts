import { LitElement, type PropertyDeclarations } from 'lit';

type Constructor<T> = new (...args: any[]) => T;

/** Nur gemeinsame Inhalte. Keine Annahmen über Layout oder Formularmodelle. */
export const FieldContentMixin = <TBase extends Constructor<LitElement>>(Base: TBase) => {
  class FieldContentElement extends Base {
    static properties: PropertyDeclarations = {
      label: { type: String },
      infoText: { type: String, attribute: 'info-text' },
    };

    label = '';
    infoText = '';
  }
  return FieldContentElement;
};
