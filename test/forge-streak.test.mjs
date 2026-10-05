import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { forge, git, removeDir, tempDir } from './helpers/forge.mjs';

function makeRepo(root, name, { commit = true } = {}) {
  const repo = path.join(root, name);
  fs.mkdirSync(repo, { recursive: true });
  fs.writeFileSync(path.join(repo, 'file.txt'), 'hello\n');
  assert.equal(git(['init', '-b', 'main'], repo).status, 0);
  if (commit) {
    assert.equal(git(['add', '-A'], repo).status, 0);
    const result = git(
      ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'feat: first'],
      repo,
    );
    assert.equal(result.status, 0, result.stderr);
  }
  return repo;
}

test('streak counts commits from nested repositories', () => {
  const root = tempDir();
  try {
    makeRepo(root, 'sample-repo');
    const result = forge(['streak', root, '--days', '7']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /current streak\s+1 day/);
    assert.match(result.stdout, /commits\s+1\b/);
    assert.match(result.stdout, /sample-repo/);
  } finally {
    removeDir(root);
  }
});

test('streak reports repositories without commits', () => {
  const root = tempDir();
  try {
    makeRepo(root, 'empty-repo', { commit: false });
    const result = forge(['streak', root, '--days', '7']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /commits\s+0\b/);
  } finally {
    removeDir(root);
  }
});

test('streak fails when no repositories exist', () => {
  const root = tempDir();
  try {
    const result = forge(['streak', root]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /no git repositories found/);
  } finally {
    removeDir(root);
  }
});
