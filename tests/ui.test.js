const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');

const requiredViews = ['map', 'courses', 'diagnostic', 'sessions', 'activity', 'data'];
requiredViews.forEach((view) => {
  assert.match(html, new RegExp(`data-view="${view}"`), `Missing ${view} view`);
});

const requiredControls = [
  'create-course',
  'delete-course',
  'save-course',
  'add-concept',
  'add-relationship',
  'start-diagnostic',
  'generate-session',
  'export-data',
  'import-data',
  'reset-data'
];
requiredControls.forEach((id) => {
  assert.match(html, new RegExp(`id="${id}"`), `Missing #${id}`);
});

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.strictEqual(ids.length, new Set(ids).size, 'HTML contains duplicate element IDs');

const referencedIds = [...main.matchAll(/\$\('#([^']+)'\)/g)].map((match) => match[1]);
referencedIds.forEach((id) => {
  assert(ids.includes(id), `main.js references missing #${id}`);
});

['js/mastery-engine.js', 'js/course-manager.js', 'js/sample-data.js', 'js/main.js'].forEach((script) => {
  assert.match(html, new RegExp(`<script src="${script.replace('.', '\\.')}"`));
  assert(fs.existsSync(path.join(root, script)), `Missing ${script}`);
});

assert.match(html, /class="skip-link"/);
assert.match(html, /aria-live="polite"/);
assert.match(html, /<main id="main-content"/);
assert.match(html, /<dialog[^>]+id="diagnostic-dialog"/);

console.log('UI structure tests passed.');
