# Lit: Mixin + ValidationController + verschachtelte FormGroup

Ein kleines, ausführbares TypeScript-Beispiel mit zwei Textinputs und einem
Gruppenvalidator. Alle Formularbausteine sind eigene Beispielimplementierungen,
keine eingebauten Lit-Klassen und keine Angular-Abhängigkeiten.

## Starten

Voraussetzung: Node.js ab 22.18 und npm.

```sh
npm ci
npm run dev
```

Die im Terminal ausgegebene lokale URL öffnen. Für Prüfungen:

```sh
npm run typecheck
npm test
npm run build
```

## Die drei Zuständigkeiten

| Baustein | Aufgabe |
| --- | --- |
| `FormControlMixin<T>` | Öffentliche Properties `control` und `validators`, Getter für Ergebnisse sowie Methoden am Custom Element. |
| `ValidationController<T>` | Lit-Anbindung: Modell abonnieren, Render-Updates anfordern, öffentliche Prüfmethoden delegieren und `validation-change` ausgeben. |
| `FormControl<T>` / `FormGroup<C>` | Werte, Regeln und Ergebnisse speichern; synchron validieren; Werte und Status rekursiv aggregieren. |

**Die Validierung liegt verbindlich im Modell.** Bei verschachtelten Formularen
muss die Gruppe auch vor dem Mounten oder ohne DOM korrekt sein. Der Controller
ist deshalb der Lit-Adapter für dieses Modell und kein zweiter Validierungsspeicher.
Er ruft bei `validate()` die Modellvalidierung auf. Benutzeränderungen gehen direkt
an das Control; dessen Benachrichtigungen aktualisieren die gesamte Gruppe.

## Dateien und empfohlene Lesereihenfolge

1. `src/demo-form.ts`: der konkrete, typisierte Formularbaum und seine Regeln.
2. `src/form-model.ts`: einzelne Controls, Gruppen und synchrone Weitergabe nach oben.
3. `src/validation-controller.ts`: Lifecycle, Abonnement und Events.
4. `src/form-control-mixin.ts`: öffentliche API; keine eigene Kopie von Werten oder Fehlern.
5. `src/ds-text-input.ts`: Darstellung und Bedienung des Textinputs.
6. `src/form-demo.ts`: Bindings, Gruppenmeldung, Submit, Reset und Live-Zustand.

```text
form: FormGroup
└── confirmation: FormGroup         ← prüft: text === repeat
    ├── text: FormControl<string>   ← prüft: nicht leer
    └── repeat: FormControl<string> ← prüft: nicht leer
```

Die Gruppe ist logisch verschachtelt. Im HTML existiert genau ein `<form>`.
Der sichtbare Gruppenbereich ist ein `<fieldset>` mit `<legend>`.

## Was bei einer Eingabe passiert

1. Das native `input`-Event ruft `control.setValue(value, { user: true })` auf.
2. Das Control speichert den Wert und prüft seine eigenen Regeln synchron.
3. Die innere Gruppe erhält die Benachrichtigung und prüft ihren Gruppenvalidator.
4. Die äußere Gruppe übernimmt den aggregierten Status und Wert.
5. Die jeweiligen ValidationController fordern Lit-Updates an.
6. Textinputs, Gruppenmeldung und Zustandsansicht lesen direkt aus dem Modell.

Am Ende von `setValue()` sind die Modellzustände aller Eltern aktuell. Lediglich
das Rendern durch Lit erfolgt asynchron. Zum Lesen des Formularwertes muss man
also nicht auf `updateComplete` warten.

## Properties und Regeln

Das Mixin ergänzt eine reaktive `.control`-Property. Der eigene Setter bindet
den Controller unmittelbar an das neue Modell und löst ein Update aus.
Das verhindert, dass ein direkt anschließendes `element.validate()` noch das alte
Modell prüft. Beim Austausch wird das alte Abonnement entfernt.

Validatoren werden in der Demo am Modell konfiguriert. Optional bietet das Mixin
eine `.validators`-Property als Weiterleitung an dasselbe Modell:

```ts
input.control = form.controls.confirmation.controls.text;
input.validators = [required]; // ersetzt die Regeln dieses Modells
```

Für diesen optionalen Setter muss `control` bereits gebunden sein. Alternativ
immer `control.setValidators(...)` verwenden. Es gibt keinen zweiten Regelsatz
im Element. Arrays und Objektwerte sollen ersetzt statt in-place mutiert werden.

Die Lit-Properties werden ohne Decorators mit `static properties` deklariert.
`useDefineForClassFields: false` in der tsconfig verhindert, dass initialisierte
Klassenfelder die von Lit erzeugten Property-Accessors verdecken.

## Fehler und Interaktion

- Anfangs ist das Formular wegen der leeren Pflichtfelder ungültig. Fehlertexte
  bleiben zunächst verborgen.
- Feldfehler erscheinen nach Blur oder einem Absendeversuch.
- Der Gruppenfehler erscheint, sobald beide Felder verlassen wurden oder ein
  Absenden versucht wurde. Leere Felder erzeugen nur ihre Pflichtfeldfehler.
- `group.errors` enthält ausschließlich die Regeln der Gruppe. Ein Fehler eines
  Kindes beeinflusst `group.valid`, wird aber nicht nach `group.errors` kopiert.
- `dirty` bedeutet: mindestens eine Benutzeränderung seit dem Reset. Eine spätere
  Rückkehr zum Anfangswert macht ein Feld nicht automatisch wieder pristine.
- Programmgesteuertes `setValue()` markiert standardmäßig weder dirty noch touched.
- Reset stellt Anfangswerte und Interaktionszustände wieder her und prüft neu.

## Events

`validation-change` meldet Änderungen von `valid` oder eigenen `errors`, auch wenn
sie durch programmatische Änderungen ausgelöst werden. Ein Prüflauf ohne
Ergebnisänderung löst dieses Event nicht aus. Initiales Binden erzeugt kein Event.
Der Event-Detailtyp ist `ValidationChange`. `bubbles` und `composed` sind `true`.

Die Gruppen synchronisieren sich über Modellabonnements, nicht über diese Events.
Ein Listener an einem Vorfahren kann daher Meldungen mehrerer Ebenen erhalten.
Für den gesamten Formularzustand direkt `form.subscribe(...)` verwenden.

Das native `input`-Event der Textbox läuft über die Shadow-DOM-Grenze weiter.
`change` wird vom Custom Element ausdrücklich weitergegeben. Programmgesteuerte
Wertänderungen erzeugen keine Benutzer-Events.

## Formularanbindung und bewusster Umfang

Der Submit-Handler verhindert die Browserübertragung, markiert alle Felder als
touched, prüft das Modell und zeigt bei Erfolg dessen verschachtelten Wert.
Es werden keine Daten gesendet.

Dieses Beispiel implementiert **keine** Form-associated Custom Elements und keine
`ElementInternals`-Anbindung. `new FormData(nativeForm)` enthält die Werte der
inneren Shadow-DOM-Inputs nicht automatisch. `form.checkValidity()` kennt weder
die Modellvalidatoren noch den Gruppenvalidator. Dafür wäre ein eigener Adapter
erforderlich. `novalidate` macht den hier verwendeten expliziten Submit-Ablauf klar.

Die Modellhierarchie ist statisch. Nicht enthalten sind asynchrone Validatoren,
`pending`, `disabled`, dynamisches Hinzufügen/Entfernen von Controls, FormArrays,
Serverkommunikation und Framework-Adapter. Ein Control gehört in diesem Beispiel
zu genau einem Modellbaum. Gruppenabonnements leben so lange wie dieser Baum;
DOM-Abonnements werden beim Disconnect entfernt und beim Reconnect erneuert.

Objektwerte müssen unveränderlich behandelt werden; Anfangswerte werden nicht tief
kopiert. Gruppenoperationen wie Reset können mehrere synchrone Benachrichtigungen
erzeugen. Transaktionen wären eine spätere Erweiterung.

## Primärquellen

- [Lit: Mixins](https://lit.dev/docs/composition/mixins/)
- [Lit: Reactive Controllers](https://lit.dev/docs/composition/controllers/)
- [Lit: Reactive Properties](https://lit.dev/docs/components/properties/)

Die Quellen erklären die Lit-Mechanismen. Formularmodell und Aufteilung sind der
Architekturvorschlag dieses Beispiels.

## Durchgeführte Prüfung

- TypeScript-Prüfung im Strict-Modus erfolgreich.
- Alle sieben mitgelieferten Modelltests erfolgreich.
- Vite-Produktionsbuild erfolgreich.
- Browserprüfung in Microsoft Edge: Pflichtfelder, Gruppenfehler, erfolgreiches
  und abgewiesenes Absenden, Reset, programmatische Wert- und Validatoränderungen,
  Event-Deduplizierung, Modellwechsel und Disconnect/Reconnect erfolgreich.
- Desktop- und mobile Darstellung visuell geprüft; bei 390 px kein Seitenüberlauf.

Die Browserprüfung ist eine zusätzlich ausgeführte Prüfung; `npm test` führt die
mitgelieferten Modelltests aus. Eine vollständige Browser- oder Screenreader-Matrix
ist nicht Teil dieses Beispiels.
