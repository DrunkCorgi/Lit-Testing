# Checkbox Testing

Dieses Beispiel verwendet die vorhandenen FormControl-, FormGroup-, Mixin- und
ValidationController-Implementierungen eine Ebene höher.

## Ausprobieren

Im Projektverzeichnis `C:\Projects\Lit` den vorhandenen Entwicklungsserver starten:

```sh
npm run dev
```

Dann `/src/checkbox-testing/` auf dessen lokaler URL öffnen, üblicherweise:
`http://127.0.0.1:5173/src/checkbox-testing/`.

Die Demo besitzt eine einzelne Checkbox und eine Checkbox-Gruppe. „Prüfen“ zeigt
Fehler, „Zurücksetzen“ setzt Werte und Interaktion zurück. „Beispielwerte setzen“
zeigt die Aktualisierung über das Modell ohne simulierte Benutzerereignisse.

## Aufbau

```text
FieldContentMixin              label + infoText, ohne festgelegtes Layout
FormControlMixin<T>             vorhandene öffentliche Formular-API
ValidationController<T>         vorhandene Verbindung zwischen Modell und Lit

DsCheckbox                     FormControl<boolean>
└── renderCheckbox(...)        native Checkbox, Label und optionaler Hilfetext

DsCheckboxGroup                FormControl<readonly string[]>
├── renderCheckbox(...)        E-Mail
├── renderCheckbox(...)        Telefon
├── renderCheckbox(...)        SMS
└── renderCheckbox(...)        Brief (deaktiviert)
```

**Die Gruppe verwendet nicht die vollständige DsCheckbox-Komponente.** Beide
verwenden die gemeinsame Template-Funktion aus `checkbox-view.ts`. Das vermeidet
zusätzliche FormControls und abzuschaltende Validatoren auf den Gruppenoptionen.

Die Gruppe ist ein einzelnes Array-Feld, keine FormGroup mit booleschen Kindern.
Nur das darüberliegende Demoformular ist eine FormGroup mit zwei Feldern:

```ts
{
  consent: boolean,
  channels: readonly string[]
}
```

## Dateien

- `field-content-mixin.ts`: gemeinsame Properties `label` und `infoText`.
- `checkbox-view.ts`: gemeinsames, modellfreies Template und gemeinsame Styles.
- `ds-checkbox.ts`: Einzelcheckbox mit FormControl-Mixin für `boolean`.
- `ds-checkbox-group.ts`: Gruppenbeschriftung, Optionen und ein Array-Control.
- `selection.ts`: Optionstyp und unveränderliche Auswahlaktualisierung.
- `checkbox-form.ts`: Demo-Modell und beide Validatoren.
- `checkbox-demo.ts` / `index.html`: eigenständige Vorschau.
- `checkbox-model.test.ts`: sechs automatisierte Modelltests.

## Label, Hilfetext und Fehler

Das Content-Mixin definiert nur Properties. Es entscheidet nicht, wo ein Label
steht. Einzelcheckbox und Optionen rendern das Label neben dem Kästchen. Die
Gruppe verwendet ein `fieldset` mit `legend` als Gruppenbeschriftung.

Das gemeinsame Template rendert direkt im Shadow Root des jeweiligen Besitzers.
Dadurch verweisen `label for` und `aria-describedby` auf Elemente im selben
DOM-Baum. Gruppenoptionen können einen eigenen Hilfetext haben; Gruppenhinweis
und Gruppenfehler werden zusätzlich über ihre IDs zugeordnet.

Feldfehler werden nach Verlassen des Feldes oder einem Absendeversuch angezeigt.
Bei der Gruppe zählt der Fokuswechsel zwischen zwei Optionen nicht als Verlassen.
Ein vorheriges touched bleibt bis zum Reset bestehen.

## Wert und Events

Das Modell ist die einzige verbindliche Quelle für checked bzw. das ausgewählte
Array. Die Optionen besitzen keinen eigenen Formularzustand. Beim Anklicken wird
zuerst `setValue(..., { user: true })` aufgerufen. Danach sendet der Besitzer genau
ein öffentliches `input`- und `change`-Event, jeweils mit `bubbles` und `composed`.
Der aktualisierte Modellwert ist zu diesem Zeitpunkt synchron verfügbar.

Die nativen Ereignisse werden am inneren Input gestoppt, damit keine doppelten
öffentlichen Ereignisse entstehen. Ein programmatisches `setValue()` löst keine
Benutzerereignisse aus. `validation-change` kommt weiterhin vom vorhandenen
ValidationController und nur bei geändertem Prüfergebnis.

Die options-Werte müssen eindeutig sein. Die options-Liste bei Änderungen durch
ein neues Array ersetzen. Bereits ausgewählte, später entfernte oder deaktivierte
Optionen werden nicht automatisch aus dem Modell gelöscht. Die Anwendung ist für
eine solche Bereinigung zuständig.

## Geltungsbereich von disabled und Formularintegration

`disabled` sowie `option.disabled` sperren hier die Bedienung. Das bestehende
Formularmodell hat noch keinen disabled-Zustand; diese UI-Properties entfernen
daher keine Werte aus dem Modell und setzen keine Validatoren außer Kraft.

Wie im bisherigen Beispiel gibt es keine ElementInternals-/FACE-Anbindung.
Der Submit-Handler prüft das Modell ausdrücklich. Native `FormData` oder
`form.checkValidity()` übernehmen dessen Regeln nicht automatisch.

## Prüfen

Im Projektverzeichnis:

```sh
npm run typecheck
npm test
node --experimental-strip-types --test src/checkbox-testing/checkbox-model.test.ts
npm run build
```

Die zusätzliche Vite-Konfiguration nimmt sowohl die ursprüngliche Demo als auch
diese zweite HTML-Seite in den Produktionsbuild auf.
