import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoForm } from '../src/demo-form.ts';
import { FormControl, FormGroup } from '../src/form-model.ts';

test('empty fields invalidate both parent groups without inventing group errors', () => {
  const form = createDemoForm();
  const group = form.controls.confirmation;
  assert.equal(form.valid, false);
  assert.equal(group.valid, false);
  assert.deepEqual(form.errors, []);
  assert.deepEqual(group.errors, []);
  assert.equal(group.controls.text.errors[0]?.code, 'required');
  assert.equal(form.touched, false);
});

test('group mismatch is distinct from field errors and propagates synchronously', () => {
  const form = createDemoForm();
  const group = form.controls.confirmation;
  group.controls.text.setValue('Hallo', { user: true });
  group.controls.repeat.setValue('Anders', { user: true });
  assert.equal(group.controls.text.valid, true);
  assert.equal(group.controls.repeat.valid, true);
  assert.equal(group.errors[0]?.code, 'mismatch');
  assert.equal(form.valid, false);
  assert.equal(form.dirty, true);
  group.controls.repeat.setValue('Hallo');
  assert.equal(form.valid, true);
  assert.deepEqual(group.errors, []);
  assert.deepEqual(form.value, { confirmation: { text: 'Hallo', repeat: 'Hallo' } });
});

test('programmatic changes do not imply user interaction', () => {
  const form = createDemoForm();
  form.controls.confirmation.controls.text.setValue('Hallo');
  assert.equal(form.dirty, false);
  assert.equal(form.touched, false);
});

test('recursive touch and reset restore defaults, interaction, and validity', () => {
  const form = createDemoForm();
  const group = form.controls.confirmation;
  group.controls.text.setValue('A', { user: true });
  group.controls.repeat.setValue('B', { user: true });
  form.markAllAsTouched();
  assert.equal(group.controls.text.touched, true);
  assert.equal(group.controls.repeat.touched, true);
  form.reset();
  assert.deepEqual(form.value, { confirmation: { text: '', repeat: '' } });
  assert.equal(form.touched, false);
  assert.equal(form.dirty, false);
  assert.equal(form.valid, false);
  assert.deepEqual(group.errors, []);
});

test('reset uses the initial value, not a hard-coded empty string', () => {
  const control = new FormControl('Vorbelegt');
  control.setValue('Geändert', { user: true });
  control.reset();
  assert.equal(control.value, 'Vorbelegt');
  assert.equal(control.dirty, false);
});

test('replacing validators recalculates all ancestor groups', () => {
  const leaf = new FormControl('x');
  const root = new FormGroup({ nested: new FormGroup({ leaf }) });
  leaf.setValidators([() => ({ code: 'server', message: 'Nicht verfügbar.' })]);
  assert.equal(root.valid, false);
  leaf.setValidators([]);
  assert.equal(root.valid, true);
});

test('unsubscribing stops delivery without breaking the tree', () => {
  const form = createDemoForm();
  let notifications = 0;
  const unsubscribe = form.subscribe(() => notifications++);
  form.controls.confirmation.controls.text.setValue('A');
  assert.equal(notifications, 1);
  unsubscribe();
  form.controls.confirmation.controls.text.setValue('B');
  assert.equal(notifications, 1);
  assert.equal(form.value.confirmation.text, 'B');
});
