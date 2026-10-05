import assert from 'node:assert/strict';
import { test } from 'node:test';
import { forge } from './helpers/forge.mjs';

test('help prints the full command surface', () => {
  const result = forge(['help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /AI Daily Forge/);
  for (const command of ['doctor', 'new', 'audit', 'streak', 'log', 'ideas', 'templates']) {
    assert.match(result.stdout, new RegExp(command));
  }
});

test('no arguments prints help and succeeds', () => {
  const result = forge([]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage/);
});

test('templates lists every shipped template', () => {
  const result = forge(['templates']);
  assert.equal(result.status, 0);
  for (const name of ['digest', 'mcp-server', 'python-tool', 'skill-pack']) {
    assert.match(result.stdout, new RegExp(name));
  }
});

test('unknown commands fail with the usage exit code', () => {
  const result = forge(['bogus']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown command "bogus"/);
});
