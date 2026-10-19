/** A deliberately small, synchronous form model with no Lit/DOM dependency. */
export type ValidationError = Readonly<{ code: string; message: string }>;
export type Validator<T> = (value: T) => ValidationError | null;
type Listener = () => void;

/** The common read/operation contract makes nested groups possible. */
export interface FormNode<T> {
  readonly value: T;
  readonly errors: readonly ValidationError[];
  readonly valid: boolean;
  readonly touched: boolean;
  readonly dirty: boolean;
  subscribe(listener: Listener): () => void;
  validate(): boolean;
  markAllAsTouched(): void;
  reset(): void;
}

abstract class AbstractControl<T> implements FormNode<T> {
  private readonly listeners = new Set<Listener>();
  private rules: readonly Validator<T>[];
  private ownErrors: readonly ValidationError[] = [];
  protected ownTouched = false;
  protected ownDirty = false;

  constructor(validators: readonly Validator<T>[] = []) {
    this.rules = [...validators];
  }

  abstract readonly value: T;
  abstract reset(): void;

  get validators(): readonly Validator<T>[] { return this.rules; }
  get errors(): readonly ValidationError[] { return this.ownErrors; }
  get valid(): boolean { return this.errors.length === 0; }
  get touched(): boolean { return this.ownTouched; }
  get dirty(): boolean { return this.ownDirty; }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setValidators(validators: readonly Validator<T>[]): void {
    this.rules = [...validators];
    this.validate();
  }

  protected evaluate(): void {
    const value = this.value;
    this.ownErrors = Object.freeze(this.rules.flatMap((rule) => {
      const error = rule(value);
      return error ? [Object.freeze({ ...error })] : [];
    }));
  }

  protected notify(): void {
    for (const listener of [...this.listeners]) listener();
  }

  validate(): boolean {
    this.evaluate();
    this.notify();
    return this.valid;
  }

  markAllAsTouched(): void {
    this.ownTouched = true;
    this.notify();
  }
}

export class FormControl<T> extends AbstractControl<T> {
  private currentValue: T;
  private readonly initialValue: T;

  constructor(initialValue: T, validators: readonly Validator<T>[] = []) {
    super(validators);
    this.initialValue = initialValue;
    this.currentValue = initialValue;
    this.evaluate();
  }

  get value(): T { return this.currentValue; }

  /** Programmatic writes do not mark the control dirty by default. */
  setValue(value: T, options: { user?: boolean } = {}): void {
    this.currentValue = value;
    if (options.user) this.ownDirty = true;
    this.validate(); // Synchronous: parents are current before this returns.
  }

  reset(): void {
    this.currentValue = this.initialValue;
    this.ownTouched = false;
    this.ownDirty = false;
    this.validate();
  }
}

type Children = Record<string, FormNode<unknown>>;
export type GroupValue<C extends Children> = {
  [K in keyof C]: C[K] extends FormNode<infer V> ? V : never;
};

export class FormGroup<C extends Children> extends AbstractControl<GroupValue<C>> {
  readonly controls: Readonly<C>;

  constructor(controls: C, validators: readonly Validator<GroupValue<C>>[] = []) {
    super(validators);
    this.controls = Object.freeze({ ...controls });
    // Fixed tree for this example. Changes travel upward through subscriptions,
    // not DOM events. A nested group is just another FormNode.
    for (const child of Object.values(this.controls)) {
      child.subscribe(() => {
        this.evaluate();
        this.notify();
      });
    }
    this.evaluate();
  }

  get value(): GroupValue<C> {
    return Object.fromEntries(
      Object.entries(this.controls).map(([name, control]) => [name, control.value]),
    ) as GroupValue<C>;
  }

  get valid(): boolean {
    return super.valid && Object.values(this.controls).every((child) => child.valid);
  }

  get touched(): boolean {
    return this.ownTouched || Object.values(this.controls).some((child) => child.touched);
  }

  get dirty(): boolean {
    return Object.values(this.controls).some((child) => child.dirty);
  }

  validate(): boolean {
    for (const child of Object.values(this.controls)) child.validate();
    return super.validate();
  }

  markAllAsTouched(): void {
    for (const child of Object.values(this.controls)) child.markAllAsTouched();
    super.markAllAsTouched();
  }

  reset(): void {
    this.ownTouched = false;
    this.ownDirty = false;
    for (const child of Object.values(this.controls)) child.reset();
    this.evaluate();
    this.notify();
  }
}
