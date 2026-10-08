const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('./core.js');
const item = (overrides = {}) => ({ id: 'a', name: 'Rice', quantity: 300, unit: 'g', location: 'Pantry', useDate: '', ...overrides });
const need = (overrides = {}) => ({ id: 'n', name: 'Rice', quantity: 500, unit: 'g', ...overrides });
test('sample is explicitly fictional and survives strict JSON round trip', () => { const sample = C.sample(); assert.equal(sample.demo, true); assert.deepEqual(C.validateState(JSON.parse(JSON.stringify(sample))), sample); });
test('empty state has no fictional or real records', () => { assert.deepEqual(C.validateState(C.empty()), C.empty()); assert.equal(C.empty().demo, false); });
test('shopping target subtracts matching stock across locations, ignoring case', () => { const state = { ...C.empty(), items: [item(), item({ id: 'b', name: ' rice ', quantity: 50, location: 'Fridge' })], needs: [need()] }; assert.equal(C.shoppingList(state)[0].buy, 150); });
test('shopping does not silently convert kilograms to grams or guess synonyms', () => { const state = { ...C.empty(), items: [item({ unit: 'kg' }), item({ id: 'b', name: 'Brown rice' })], needs: [need()] }; assert.equal(C.shoppingList(state)[0].buy, 500); });
test('covered targets clamp at zero and follow items to buy', () => { const rows = C.shoppingList({ ...C.empty(), items: [item()], needs: [need({ quantity: 200 }), need({ id: 'other', name: 'Beans' })] }); assert.equal(rows[0].name, 'Beans'); assert.equal(rows[1].buy, 0); });
test('decimal arithmetic does not invent fractional purchases', () => { const state = { ...C.empty(), items: [item({ quantity: 0.1 }), item({ id: 'b', quantity: 0.2 })], needs: [need({ quantity: 0.3 })] }; assert.equal(C.shoppingList(state)[0].buy, 0); });
test('use-first sort includes past dates, then upcoming, then undated without mutating', () => { const items = [item(), item({ id: 'b', useDate: '2026-10-08' }), item({ id: 'c', useDate: '2020-01-01' })]; assert.deepEqual(C.useFirst(items).map(row => row.id), ['c', 'b', 'a']); assert.equal(items[0].id, 'a'); });
test('valid leap day accepted, impossible and compact dates rejected', () => { assert.equal(C.validateItem(item({ useDate: '2024-02-29' })).useDate, '2024-02-29'); for (const useDate of ['2026-02-29', '2026-13-01', '20261001', '2026-1-01', '0000-01-01', null]) assert.throws(() => C.validateItem(item({ useDate }))); });
test('negative, nonfinite, string, excess-precision and enormous quantities rejected', () => { for (const quantity of [-1, NaN, Infinity, '4', null, 0.0001, 1000000001]) assert.throws(() => C.validateItem(item({ quantity }))); assert.equal(C.validateItem(item({ quantity: 0 })).quantity, 0); assert.throws(() => C.validateNeed(need({ quantity: 0 }))); });
test('invalid units, locations and blank names rejected', () => { for (const override of [{ unit: 'cups' }, { location: 'Unknown' }, { name: '  ' }, { name: 'x'.repeat(121) }]) assert.throws(() => C.validateItem(item(override))); });
test('duplicate IDs and duplicate case-insensitive shopping targets rejected', () => { assert.throws(() => C.validateState({ ...C.empty(), items: [item(), item()] })); assert.throws(() => C.validateState({ ...C.empty(), needs: [need(), need({ id: 'b', name: ' rice ' })] })); });
test('wrong app, version, unknown fields, missing fields and oversized list rejected', () => { for (const state of [{ ...C.empty(), app: 'other' }, { ...C.empty(), version: 2 }, { ...C.empty(), extra: 1 }, { app: 'use-it-first' }, { ...C.empty(), demo: 'yes' }, { ...C.empty(), items: Array(1001).fill(item()) }]) assert.throws(() => C.validateState(state)); });
test('item fields remain literal text for safe DOM rendering', () => { assert.equal(C.validateItem(item({ name: '<img src=x onerror=alert(1)>' })).name, '<img src=x onerror=alert(1)>'); });
test('saved data cannot outgrow the formatted UTF-8 backup import limit', () => {
  const state = C.empty();
  for (let i = 0; i < 1000; i++) {
    const id = '\u0001'.repeat(76) + i, name = '\u0002'.repeat(115) + i;
    state.items.push(item({ id, name })); state.needs.push(need({ id, name }));
  }
  assert.throws(() => C.validateState(state), /2 MB/);
});
