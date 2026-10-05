import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { forge, removeDir, tempDir } from './helpers/forge.mjs';

test('log appends newest-first entries for today', () => {
  const dir = tempDir();
  try {
    const first = forge(['log', 'built the first thing', '--dir', dir]);
    assert.equal(first.status, 0, first.stderr);
    const second = forge(['log', 'built the second thing', '--dir', dir]);
    assert.equal(second.status, 0, second.stderr);

    const logDir = path.join(dir, 'daily-log');
    const files = fs.readdirSync(logDir);
    assert.equal(files.length, 1);
    assert.match(files[0], /^\d{4}-\d{2}-\d{2}\.md$/);

    const body = fs.readFileSync(path.join(logDir, files[0]), 'utf8');
    assert.match(body, /built the first thing/);
    assert.match(body, /built the second thing/);
    assert.ok(
      body.indexOf('built the second thing') < body.indexOf('built the first thing'),
      'newest entry must be listed first',
    );
  } finally {
    removeDir(dir);
  }
});

test('log supports a kind label', () => {
  const dir = tempDir();
  try {
    const result = forge(['log', 'fixed a bug', '--kind', 'fix', '--dir', dir]);
    assert.equal(result.status, 0);
    const files = fs.readdirSync(path.join(dir, 'daily-log'));
    const body = fs.readFileSync(path.join(dir, 'daily-log', files[0]), 'utf8');
    assert.match(body, /- \*\*fix\*\* fixed a bug/);
  } finally {
    removeDir(dir);
  }
});

test('log without text is a usage error', () => {
  const result = forge(['log']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage: forge log/);
});
