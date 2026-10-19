import assert from 'node:assert/strict';
import test from 'node:test';
import { atLeastTwo, createCheckboxForm } from './checkbox-form.ts';
import { toggleSelection } from './selection.ts';

test('the form has two fields; group options have no child controls', () => {
  const form = createCheckboxForm();
  assert.deepEqual(Object.keys(form.controls), ['consent', 'channels']);
  assert.equal('controls' in form.controls.channels, false);
  assert.deepEqual(form.value, { consent: false, channels: [] });
  assert.equal(form.valid, false);
});

test('single checkbox and combined selection validate independently', () => {
  const form = createCheckboxForm();
  form.controls.consent.setValue(true, { user: true });
  form.controls.channels.setValue(['email'], { user: true });
  assert.equal(form.controls.consent.valid, true);
  assert.equal(form.controls.channels.errors[0]?.code, 'min-selection');
  assert.equal(form.valid, false);
  form.controls.channels.setValue(['email', 'phone'], { user: true });
  assert.equal(form.valid, true);
  form.controls.consent.setValue(false, { user: true });
  assert.equal(form.controls.channels.valid, true);
  assert.equal(form.controls.consent.errors[0]?.code, 'required');
  assert.equal(form.valid, false);
});

test('selection changes replace arrays, preserve other options and avoid duplicates', () => {
  const original: readonly string[] = Object.freeze(['email']);
  const selected = toggleSelection(original, 'phone', true);
  assert.deepEqual(original, ['email']);
  assert.deepEqual(selected, ['email', 'phone']);
  assert.deepEqual(toggleSelection(selected, 'phone', true), ['email', 'phone']);
  assert.deepEqual(toggleSelection(selected, 'email', false), ['phone']);
});

test('duplicate values do not satisfy the minimum selection rule', () => {
  assert.equal(atLeastTwo(['email', 'email'])?.code, 'min-selection');
});

test('programmatic presets update validity without dirty or touched', () => {
  const form = createCheckboxForm();
  form.controls.consent.setValue(true);
  form.controls.channels.setValue(['email', 'phone']);
  assert.equal(form.valid, true);
  assert.equal(form.dirty, false);
  assert.equal(form.touched, false);
});

test('reset clears selection, consent and interaction state together', () => {
  const form = createCheckboxForm();
  form.controls.consent.setValue(true, { user: true });
  form.controls.channels.setValue(['email', 'phone'], { user: true });
  form.markAllAsTouched();
  form.reset();
  assert.deepEqual(form.value, { consent: false, channels: [] });
  assert.equal(form.valid, false);
  assert.equal(form.dirty, false);
  assert.equal(form.touched, false);
});
