/*
 * Static/vector checks for the UI11 review bundle.
 * Run from any directory with: node verify_print_modes_static.cjs
 * This does not replace Chrome UI, PNG download, PDF, or physical printer tests.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'modules', 'mwgx');
const engineSource = fs.readFileSync(path.join(root, 'print_engine.js'), 'utf8');
const studioSource = fs.readFileSync(path.join(root, 'print_studio.js'), 'utf8');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const engineContext = { window: { MWGX: { esc } } };
vm.createContext(engineContext);
vm.runInContext(engineSource, engineContext, { filename: 'print_engine.js' });
const engine = engineContext.window.MWGX_PRINT_ENGINE;

let studio;
const appApi = {
  esc,
  heading: (title, subtitle) => `<header><b>${esc(title)}</b><p>${esc(subtitle)}</p></header>`,
  button: (label, action) => `<button data-mwgx="${esc(action)}">${esc(label)}</button>`,
  context: () => ({ userId: 'static-check', shopId: 'static-check' }),
  toast: () => {}, draw: () => {},
  register: (_name, module) => { studio = module; }
};
const studioContext = {
  window: { MWGX: appApi, MWGX_PRINT_ENGINE: engine },
  document: { getElementById: () => null },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
};
vm.createContext(studioContext);
vm.runInContext(studioSource, studioContext, { filename: 'print_studio.js' });
studio.enter();

function checkMode(tab, expected) {
  studio.action(`tab:${tab}`);
  const doc = studio._test.documentData();
  const svg = engine.vectorPage(doc, 0);
  assert.equal(doc.paper, expected.paper, `${tab} paper`);
  assert.equal(doc.w, expected.w, `${tab} width`);
  assert.equal(doc.h, expected.h, `${tab} height`);
  assert.equal(doc.count, expected.count, `${tab} count`);
  assert.equal(doc.perPage, expected.perPage, `${tab} per-page count`);
  assert.match(svg, /^<svg\b/, `${tab} SVG root`);
  assert.doesNotMatch(svg, /NaN|undefined/, `${tab} invalid SVG values`);
  return { doc, svg };
}

function setEntry(tab, index, field, value) {
  studio.input({
    dataset: { entryTab: tab, entryIndex: String(index), entryField: field },
    value
  });
}

const modeResults = [];
for (const [tab, expected] of [
  ['popup-a4', { paper: 'A4', w: 210, h: 297, count: 2, perPage: 2 }],
  ['popup-a5', { paper: 'A5', w: 210, h: 148, count: 1, perPage: 1 }],
  ['golden-a4', { paper: 'A4', w: 210, h: 297, count: 1, perPage: 1 }],
  ['popup-a7', { paper: 'A4', w: 210, h: 297, count: 4, perPage: 4 }],
  ['sales-slip', { paper: 'A4', w: 210, h: 297, count: 10, perPage: 10 }]
]) {
  const { doc } = checkMode(tab, expected);
  modeResults.push(`${tab}: ${doc.paper} ${doc.w}×${doc.h} mm; ${doc.count}/${doc.perPage} per sheet`);
}

for (const size of [6, 2, 1]) {
  studio.change({ id: 'mwgx-p-sheetCount', value: String(size) });
  const { doc } = checkMode('sticker', {
    paper: 'A4', w: 210, h: 297, count: size, perPage: size
  });
  modeResults.push(`sticker ${size} up: A4 ${doc.w}×${doc.h} mm; ${doc.count}/${doc.perPage} per sheet`);
}

let stickerCases = 0;
for (const type of studio._test.stickerTypes) {
  for (const size of [6, 2, 1]) {
    studio.action(`sticker-size:${type.id}:${size}`);
    const doc = studio._test.documentData();
    const svg = engine.vectorPage(doc, 0);
    assert.equal(doc.count, size, `${type.id} count`);
    assert.doesNotMatch(svg, /NaN|undefined/, `${type.id}/${size} malformed SVG`);
    stickerCases++;
  }
}
assert.equal(stickerCases, 69, '23 sticker types × 3 sizes');

studio.action('tab:popup-a4');
setEntry('popup-a4', 0, 'title', 'POPUP A4 - A');
setEntry('popup-a4', 1, 'title', 'POPUP A4 - B');
let popupItems = studio._test.documentData().fields.items;
assert.equal(popupItems[0].title, 'POPUP A4 - A');
assert.equal(popupItems[1].title, 'POPUP A4 - B');

studio.action('tab:popup-a7');
setEntry('popup-a7', 0, 'title', 'POPUP A7 - A');
setEntry('popup-a7', 3, 'title', 'POPUP A7 - D');
const a7Items = studio._test.documentData().fields.items;
assert.equal(a7Items[0].title, 'POPUP A7 - A');
assert.equal(a7Items[3].title, 'POPUP A7 - D');

studio.action('tab:sales-slip');
setEntry('sales-slip', 0, 'contractOwner', 'PHIẾU A');
setEntry('sales-slip', 9, 'contractOwner', 'PHIẾU J');
let slipItems = studio._test.documentData().fields.items;
assert.equal(slipItems[0].contractOwner, 'PHIẾU A');
assert.equal(slipItems[9].contractOwner, 'PHIẾU J');

studio.action('tab:sticker');
for (const type of studio._test.stickerTypes) {
  studio.action(`sticker-size:${type.id}:6`);
  setEntry('sticker', 0, 'title', `${type.id}-TEM-A`);
  setEntry('sticker', 5, 'title', `${type.id}-TEM-F`);
}
for (const type of studio._test.stickerTypes) {
  studio.action(`sticker-size:${type.id}:6`);
  const stickerItems = studio._test.documentData().fields.items;
  assert.equal(stickerItems[0].title, `${type.id}-TEM-A`, `${type.id} row 1 isolation`);
  assert.equal(stickerItems[5].title, `${type.id}-TEM-F`, `${type.id} row 6 isolation`);
}

console.log([
  'PASS: static Print Studio and vector checks',
  ...modeResults,
  `Sticker SVG matrix: ${stickerCases}/69`,
  'Independent entry checks: POPUP A4, POPUP A7, all 23 sticker types, phiếu positions 1 and 10'
].join('\n'));
