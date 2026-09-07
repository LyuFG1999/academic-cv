import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dashboard = readFileSync(new URL('../src/admin/dashboard.js', import.meta.url), 'utf8');
const oauth = readFileSync(new URL('../src/admin/oauth.js', import.meta.url), 'utf8');

test('admin dashboard calls initializeOAuth with login and message callbacks', () => {
  assert.match(oauth, /export\s+async\s+function\s+initializeOAuth\s*\(\s*login\s*,\s*message\s*\)/);
  assert.match(dashboard, /initializeOAuth\s*\(\s*login\s*,\s*message\s*\)\s*;/);
  assert.doesNotMatch(dashboard, /initializeOAuth\s*\(\s*\{/);
});
