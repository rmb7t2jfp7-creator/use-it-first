(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UseItFirstCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const UNITS = ['count', 'g', 'kg', 'mL', 'L'];
  const LOCATIONS = ['Pantry', 'Fridge', 'Freezer', 'Other'];
  const empty = () => ({ app: 'use-it-first', version: 1, demo: false, items: [], needs: [] });
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function keys(value, fields, label) {
    assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object.`);
    assert(Object.keys(value).length === fields.length && fields.every(key => Object.hasOwn(value, key)), `${label} has missing or unexpected fields.`);
  }
  function text(value, label, max = 120) {
    assert(typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max, `${label} must contain 1–${max} characters.`);
    return value.trim();
  }
  function date(value) {
    assert(typeof value === 'string', 'Use-first date must be text.');
    if (value === '') return value;
    assert(/^\d{4}-\d{2}-\d{2}$/.test(value) && value.slice(0, 4) >= '1000', 'Use-first date must be YYYY-MM-DD.');
    const parsed = new Date(`${value}T00:00:00Z`);
    assert(!Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value, 'Use-first date must be a real calendar date.');
    return value;
  }
  function quantity(value, allowZero = true) {
    assert(typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000000000 && (allowZero || value > 0), `Quantity must be ${allowZero ? 'zero or positive' : 'positive'} and no more than 1,000,000,000.`);
    assert(Math.round(value * 1000) / 1000 === value, 'Use no more than three decimal places.');
    return Math.round(value * 1000) / 1000;
  }
  function identity(name, unit) { return JSON.stringify([name.trim().toLowerCase(), unit]); }
  function validateItem(item) {
    keys(item, ['id', 'name', 'quantity', 'unit', 'location', 'useDate'], 'Pantry item');
    const result = { id: text(item.id, 'Item ID', 80), name: text(item.name, 'Item name'), quantity: quantity(item.quantity), unit: item.unit, location: item.location, useDate: date(item.useDate) };
    assert(UNITS.includes(result.unit), 'Choose a supported unit.');
    assert(LOCATIONS.includes(result.location), 'Choose a supported location.');
    return result;
  }
  function validateNeed(need) {
    keys(need, ['id', 'name', 'quantity', 'unit'], 'Shopping target');
    const result = { id: text(need.id, 'Target ID', 80), name: text(need.name, 'Item name'), quantity: quantity(need.quantity, false), unit: need.unit };
    assert(UNITS.includes(result.unit), 'Choose a supported unit.');
    return result;
  }
  function validateState(state) {
    keys(state, ['app', 'version', 'demo', 'items', 'needs'], 'Backup');
    assert(state.app === 'use-it-first' && state.version === 1, 'This is not a supported Use It First version-1 backup.');
    assert(typeof state.demo === 'boolean', 'Demo status must be true or false.');
    assert(Array.isArray(state.items) && Array.isArray(state.needs), 'Items and shopping targets must be lists.');
    assert(state.items.length <= 1000 && state.needs.length <= 1000, 'Keep each list to 1,000 entries or fewer.');
    const items = state.items.map(validateItem), needs = state.needs.map(validateNeed);
    assert(new Set(items.map(item => item.id)).size === items.length, 'Pantry item IDs must be unique.');
    assert(new Set(needs.map(need => need.id)).size === needs.length, 'Shopping target IDs must be unique.');
    assert(new Set(needs.map(need => identity(need.name, need.unit))).size === needs.length, 'Use one shopping target per item name and unit.');
    const result = { app: 'use-it-first', version: 1, demo: state.demo, items, needs };
    assert(new TextEncoder().encode(JSON.stringify(result, null, 2)).length <= 2000000, 'Pantry would exceed the 2 MB backup limit. Export or remove older entries first.');
    return result;
  }
  function useFirst(items) {
    return [...items].sort((a, b) => (a.useDate || '9999-99-99').localeCompare(b.useDate || '9999-99-99') || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  }
  function shoppingList(state) {
    return state.needs.map(need => {
      const held = state.items.filter(item => identity(item.name, item.unit) === identity(need.name, need.unit)).reduce((sum, item) => sum + Math.round(item.quantity * 1000), 0);
      return { ...need, have: held / 1000, buy: Math.max(Math.round(need.quantity * 1000) - held, 0) / 1000 };
    }).sort((a, b) => Number(a.buy === 0) - Number(b.buy === 0) || a.name.localeCompare(b.name));
  }
  function sample() {
    return validateState({ app: 'use-it-first', version: 1, demo: true, items: [
      { id: 'sample-1', name: 'Spinach', quantity: 150, unit: 'g', location: 'Fridge', useDate: '2026-10-09' },
      { id: 'sample-2', name: 'Rice', quantity: 300, unit: 'g', location: 'Pantry', useDate: '' },
      { id: 'sample-3', name: 'Apples', quantity: 3, unit: 'count', location: 'Fridge', useDate: '2026-10-12' }
    ], needs: [{ id: 'sample-n1', name: 'Rice', quantity: 500, unit: 'g' }, { id: 'sample-n2', name: 'Apples', quantity: 2, unit: 'count' }] });
  }
  return { UNITS, LOCATIONS, empty, validateItem, validateNeed, validateState, useFirst, shoppingList, identity, sample };
});
