# Use It First

[Try it in your browser](https://rmb7t2jfp7-creator.github.io/use-it-first/) · [Test results](https://github.com/rmb7t2jfp7-creator/use-it-first/actions)

A small, local pantry planner: see what you have, put items in your chosen use-first order, and calculate what is missing from a shopping target.

## Open it

Download the repository and open `index.html` in a current browser. No installation, account, API key, or network connection is needed. Keep `index.html`, `styles.css`, `core.js`, and `app.js` together. For consistent browser storage during development, run `python3 -m http.server 8000` in this folder and visit `http://localhost:8000`.

1. Add a pantry entry: name, on-hand quantity, unit, location, and an optional **use-first date** that you choose.
2. Open **Shopping** and enter the total quantity you want to have.
3. The list subtracts matching pantry stock across locations and shows what remains to buy.
4. Export a JSON backup before changing devices, clearing browser data, or importing another list.

**Try fictional sample** is a separate, labeled action. It replaces the current list only after confirmation when data already exists. The fictional label is saved and exported; reset before starting a real pantry.

## How shopping quantities work

A target is the amount you want **in total**, not the amount you want to buy. If you want 500 g of rice and have 300 g, the list shows **buy 200 g**. Covered targets stay visible with zero to buy.

- Matching ignores capitalization and outer whitespace, but requires the same item name and unit. `Rice` and ` rice ` match. `Rice` and `Brown rice` do not.
- Stock is added across all locations. There is one shopping target per matching name and unit.
- Units are count, g, kg, mL, and L. The app does **not** convert units; 1 kg does not automatically match a target in g.
- Quantities allow up to three decimal places, are calculated in thousandths to avoid floating-point artifacts, and are limited to 1,000,000,000 per entry. Stock can be zero; shopping targets must be positive.
- After shopping or using something, update pantry quantities yourself. Copying a list does not change stock.

## What is built

Pantry and shopping-target create/edit/remove, pantry search, use-first sorting, matching-stock subtraction, shopping-list copying with a fallback, browser persistence, validated version-1 JSON import/export, and a fictional sample. Empty states and storage failures are visible. Reset and replacement imports require confirmation.

Use-first dates are planning notes, **not food-safety guidance**. An old date does not determine whether food is safe, and the app does not infer expiry. There are no barcode lookups, notifications, multi-user sync, emissions estimates, or measured waste-reduction claims.

## Your data

The app code sends no data over a network. Records are stored in this browser’s `localStorage`, under `use-it-first.v1`. Browser data is not encrypted by the app, may be accessible to other people using the same profile, and may disappear when browser data is cleared. Storage for a file opened directly can vary by browser and file location. Exported backups contain your records in plain text.

If storage is unavailable or full, the app continues in the current tab and says that changes are not saved. Export before leaving. If existing saved data is unreadable, the app protects it from overwrite until you explicitly import a valid backup or reset. Do not edit the same ledger in multiple tabs: there is no conflict resolution.

Imports replace the current list, rather than merge it. Import checks the app identifier, version, demo flag, every field, unique IDs, unique shopping targets, valid dates, and quantities. Backups are limited to 2 MB and each list to 1,000 entries. The same size limit applies to saved data using its formatted UTF-8 export, so a growing pantry cannot produce a backup too large to import. Unknown fields and unsupported versions are rejected so data is not silently discarded.

## Develop and test

Requires Node.js 18 or newer for tests only; the browser app has no dependencies.

```sh
node --test core.test.js
```

`core.js` contains validation, matching, sorting, and quantity calculations. It exports a browser global and CommonJS module. `app.js` handles storage and interface events. User-entered text is rendered with `textContent`, not interpreted as HTML.

Useful contributions include a reproducible bug report, a focused accessibility improvement, or a test for a documented edge case. Keep changes dependency-free and preserve explicit backup validation. Unit conversion, printable shopping lists, and cross-tab conflict handling are possible future work, not current features.

## Project status and credits

This is an initial, AI-assisted implementation made with Codex. It is a working prototype; development does not establish real-world adoption or environmental benefit. The included examples are fictional, and no usage or impact results are claimed.

MIT licensed. See [LICENSE](LICENSE).
