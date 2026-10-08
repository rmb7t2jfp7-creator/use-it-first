(function () {
  'use strict';
  const C = window.UseItFirstCore, $ = id => document.getElementById(id), KEY = 'use-it-first.v1';
  let state = C.empty(), locked = false, editItem = '', editNeed = '';
  function notice(message, error = false) { $('notice').textContent = message; $('notice').classList.toggle('error', error); $('notice').hidden = !message; }
  function storage(message) { $('storage-status').textContent = message; }
  try { const saved = localStorage.getItem(KEY); if (saved !== null) { try { state = C.validateState(JSON.parse(saved)); } catch (_) { locked = true; storage('Saved data could not be read. It is protected from overwrite; import a valid backup or reset to start again.'); } } }
  catch (_) { storage('Browser storage is unavailable. Changes stay in this tab; export a backup before leaving.'); }
  function persist() {
    if (locked) { storage('Changes are in this tab only. Unreadable saved data is protected until you import or reset.'); return; }
    try { localStorage.setItem(KEY, JSON.stringify(state)); storage('Saved in this browser. Export a backup to keep a copy.'); }
    catch (_) { storage('Could not save in this browser. Changes stay in this tab; export a backup before leaving.'); }
  }
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  function node(tag, text, className) { const element = document.createElement(tag); if (text !== undefined) element.textContent = text; if (className) element.className = className; return element; }
  function button(text, action, id, accessible) { const element = node('button', text); element.type = 'button'; element.dataset.action = action; element.dataset.id = id; if (accessible) element.setAttribute('aria-label', accessible); return element; }
  function empty(list, title, detail) { const block = node('div', undefined, 'empty'); block.append(node('div', '↟', 'empty-mark'), node('h3', title), node('p', detail)); list.append(block); }
  function render() {
    $('pantry-count').textContent = state.items.length;
    const shopping = C.shoppingList(state);
    $('shopping-count').textContent = shopping.filter(item => item.buy > 0).length;
    $('pantry-summary').textContent = `${state.demo ? 'FICTIONAL SAMPLE · ' : ''}${state.items.length} item${state.items.length === 1 ? '' : 's'} on hand`;
    $('shopping-summary').textContent = `${state.demo ? 'FICTIONAL SAMPLE · ' : ''}${shopping.filter(item => item.buy > 0).length} to buy · ${shopping.filter(item => item.buy === 0).length} already covered`;
    const list = $('pantry-list'); list.replaceChildren();
    const query = $('search').value.trim().toLowerCase();
    const filtered = C.useFirst(state.items).filter(item => `${item.name} ${item.location}`.toLowerCase().includes(query));
    for (const item of filtered) {
      const card = node('article', undefined, 'card'), info = node('div'), side = node('div', undefined, 'card-side'), actions = node('div', undefined, 'card-actions');
      info.append(node('span', item.location, 'card-kicker'), node('h3', item.name), node('p', item.useDate ? `Use first: ${item.useDate}` : 'No use-first date', 'card-meta'));
      side.append(node('p', `${item.quantity} ${item.unit}`, 'card-amount'));
      actions.append(button('Edit', 'edit-item', item.id, `Edit ${item.name}`), button('Remove', 'remove-item', item.id, `Remove ${item.name}`)); side.append(actions); card.append(info, side); list.append(card);
    }
    if (!filtered.length) empty(list, query ? 'Nothing by that name.' : 'Your shelf starts here.', query ? 'Try another item name or location.' : 'Add a few things you already have, or try the fictional sample to explore.');
    const needs = $('shopping-list'); needs.replaceChildren();
    for (const item of shopping) {
      const card = node('article', undefined, 'card'), info = node('div'), side = node('div', undefined, 'card-side'), actions = node('div', undefined, 'card-actions');
      info.append(node('span', item.buy ? 'ON YOUR LIST' : 'ALREADY COVERED', 'card-kicker'), node('h3', item.name), node('p', `Want ${item.quantity} ${item.unit} · Have ${item.have} ${item.unit}`, 'card-meta'));
      if (!item.buy) info.append(node('span', 'No purchase needed for this target', 'pill'));
      side.append(node('p', `Buy ${item.buy} ${item.unit}`, 'card-amount'));
      actions.append(button('Edit', 'edit-need', item.id, `Edit target for ${item.name}`), button('Remove', 'remove-need', item.id, `Remove target for ${item.name}`)); side.append(actions); card.append(info, side); needs.append(card);
    }
    if (!shopping.length) empty(needs, 'A more thoughtful list.', 'Tell us how much you want in total. Matching stock across all locations will be subtracted.');
    $('copy-list').disabled = shopping.every(item => item.buy === 0);
    $('copy-fallback').hidden = true;
  }
  function save(next) { state = C.validateState(next); persist(); render(); }
  function clearItem() { editItem = ''; $('item-form').reset(); $('item-id').value = ''; $('item-form-title').textContent = 'Add to your pantry'; $('item-cancel').hidden = true; $('item-error').hidden = true; }
  function clearNeed() { editNeed = ''; $('need-form').reset(); $('need-id').value = ''; $('need-form-title').textContent = 'Add a shopping target'; $('need-cancel').hidden = true; $('need-error').hidden = true; }
  function formError(id, error) { $(id).textContent = error.message; $(id).hidden = false; }
  $('item-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const item = C.validateItem({ id: editItem || uid(), name: $('item-name').value, quantity: Number($('item-quantity').value), unit: $('item-unit').value, location: $('item-location').value, useDate: $('item-date').value });
      save({ ...state, items: editItem ? state.items.map(old => old.id === editItem ? item : old) : [...state.items, item] }); clearItem(); notice('Pantry updated.'); $('item-name').focus();
    } catch (error) { formError('item-error', error); }
  });
  $('need-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const need = C.validateNeed({ id: editNeed || uid(), name: $('need-name').value, quantity: Number($('need-quantity').value), unit: $('need-unit').value });
      save({ ...state, needs: editNeed ? state.needs.map(old => old.id === editNeed ? need : old) : [...state.needs, need] }); clearNeed(); notice('Shopping target updated.'); $('need-name').focus();
    } catch (error) { formError('need-error', error); }
  });
  $('item-cancel').addEventListener('click', () => { clearItem(); $('item-name').focus(); });
  $('need-cancel').addEventListener('click', () => { clearNeed(); $('need-name').focus(); });
  $('search').addEventListener('input', render);
  function view(shopping) { $('pantry-panel').hidden = shopping; $('shopping-panel').hidden = !shopping; $('pantry-tab').classList.toggle('active', !shopping); $('shopping-tab').classList.toggle('active', shopping); $('pantry-tab').setAttribute('aria-pressed', String(!shopping)); $('shopping-tab').setAttribute('aria-pressed', String(shopping)); }
  $('pantry-tab').addEventListener('click', () => view(false)); $('shopping-tab').addEventListener('click', () => view(true));
  document.addEventListener('click', event => {
    const target = event.target.closest('button[data-action]'); if (!target) return;
    const { action, id } = target.dataset;
    if (action === 'edit-item') {
      const item = state.items.find(item => item.id === id); if (!item) return; editItem = id;
      $('item-id').value = id; $('item-name').value = item.name; $('item-quantity').value = item.quantity; $('item-unit').value = item.unit; $('item-location').value = item.location; $('item-date').value = item.useDate; $('item-form-title').textContent = 'Edit pantry item'; $('item-cancel').hidden = false; $('item-error').hidden = true; $('item-name').focus();
    } else if (action === 'edit-need') {
      const need = state.needs.find(need => need.id === id); if (!need) return; editNeed = id;
      $('need-id').value = id; $('need-name').value = need.name; $('need-quantity').value = need.quantity; $('need-unit').value = need.unit; $('need-form-title').textContent = 'Edit shopping target'; $('need-cancel').hidden = false; $('need-error').hidden = true; $('need-name').focus();
    } else if (action === 'remove-item' && confirm('Remove this pantry entry?')) { save({ ...state, items: state.items.filter(item => item.id !== id) }); if (editItem === id) clearItem(); notice('Pantry entry removed.'); }
    else if (action === 'remove-need' && confirm('Remove this shopping target?')) { save({ ...state, needs: state.needs.filter(need => need.id !== id) }); if (editNeed === id) clearNeed(); notice('Shopping target removed.'); }
  });
  $('export').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })); const link = node('a'); link.href = url; link.download = 'use-it-first-backup.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('Backup prepared. Keep the downloaded JSON file for later.'); });
  $('import').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try { if (file.size > 2000000) throw new Error('Backup must be smaller than 2 MB.'); const next = C.validateState(JSON.parse(await file.text())); if (confirm('Replace this pantry and shopping list with the imported backup? Export first if you want to keep the current data.')) { locked = false; save(next); clearItem(); clearNeed(); notice(next.demo ? 'Fictional sample backup loaded.' : 'Backup imported.'); } }
    catch (error) { notice(`Import failed: ${error.message}`, true); }
    event.target.value = '';
  });
  $('sample').addEventListener('click', () => { if ((locked || state.items.length || state.needs.length) && !confirm('Replace current data with a fictional sample? Export a backup first to keep it.')) return; locked = false; save(C.sample()); clearItem(); clearNeed(); notice('Fictional sample loaded. Reset before starting your own pantry.'); });
  $('reset').addEventListener('click', () => { if (!confirm('Clear all pantry items and shopping targets in this browser? This cannot be undone without a backup.')) return; locked = false; save(C.empty()); clearItem(); clearNeed(); notice('Pantry and shopping list cleared.'); });
  $('copy-list').addEventListener('click', async () => {
    const content = `${state.demo ? 'FICTIONAL SAMPLE\n' : ''}Shopping list\n` + C.shoppingList(state).filter(item => item.buy > 0).map(item => `${item.name}: ${item.buy} ${item.unit}`).join('\n');
    try { if (!navigator.clipboard) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(content); notice('Shopping list copied.'); }
    catch (_) { $('copy-fallback').value = content; $('copy-fallback').hidden = false; $('copy-fallback').focus(); $('copy-fallback').select(); notice('Select and copy the list below. Clipboard access is unavailable here.'); }
  });
  render();
})();
