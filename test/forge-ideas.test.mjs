import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { forge, removeDir, tempDir, TEMPLATES } from './helpers/forge.mjs';

test('ideas prints a ranked shortlist', () => {
  const result = forge(['ideas', '--limit', '3']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Next up/);
  assert.match(result.stdout, /1\./);
  assert.match(result.stdout, /2\./);
});

test('ideas --md prints a markdown table', () => {
  const result = forge(['ideas', '--md', '--limit', '3']);
  assert.equal(result.status, 0);
  const lines = result.stdout.split(/\r?\n/);
  assert.equal(lines[0], '| # | Idea | Category | Effort | Impact | Stars | Publish |');
  assert.equal(lines[1], '|---|---|---|---|---|---|---|');
  assert.match(lines[2], /^\| 1 \|/);
  assert.match(lines[2], /`[a-z0-9-]+`/);
});

test('ideas filters by category', () => {
  const result = forge(['ideas', '--category', 'mcp', '--md']);
  assert.equal(result.status, 0);
  const rows = result.stdout.split(/\r?\n/).slice(2).filter(Boolean);
  assert.ok(rows.length > 0);
  for (const row of rows) {
    assert.match(row, /\| mcp \|/);
  }
});

test('ideas rejects a missing ideas file', () => {
  const dir = tempDir();
  try {
    const config = path.join(dir, 'forge.config.json');
    fs.writeFileSync(
      config,
      JSON.stringify({ templatesDir: TEMPLATES, ideasFile: path.join(dir, 'missing.json') }),
    );
    const result = forge(['ideas', '--config', config]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /no ideas file/);
  } finally {
    removeDir(dir);
  }
});
