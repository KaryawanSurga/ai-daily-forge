import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { forge, git, removeDir, tempDir } from './helpers/forge.mjs';

function writeCompleteFixture(dir) {
  fs.writeFileSync(
    path.join(dir, 'README.md'),
    [
      '# Fixture Tool',
      '',
      'Explain. '.repeat(220),
      '',
      '## Install',
      '',
      'npm install fixture-tool',
      '',
      '## Usage',
      '',
      'Run it with npx.',
      '',
      '## License',
      '',
      'MIT',
      '',
    ].join('\n'),
  );
  fs.writeFileSync(path.join(dir, 'LICENSE'), 'MIT\n');
  fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\n');

  const workflows = path.join(dir, '.github', 'workflows');
  fs.mkdirSync(workflows, { recursive: true });
  fs.writeFileSync(path.join(workflows, 'ci.yml'), 'jobs:\n  test:\n    steps:\n      - run: node --test\n');
  fs.writeFileSync(path.join(workflows, 'publish.yml'), 'name: Publish\non:\n  push:\n    tags: ["v*"]\n');

  fs.mkdirSync(path.join(dir, 'test'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'test', 'fixture.test.mjs'), '// real test lives here\n');

  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'fixture-tool', description: 'A fixture', keywords: ['fixture'] }, null, 2),
  );
}

test('audit scores a complete repository at 100', () => {
  const dir = tempDir();
  try {
    writeCompleteFixture(dir);
    git(['init', '-b', 'main'], dir);
    const result = forge(['audit', dir]);
    assert.equal(result.status, 0, result.stdout);
    assert.match(result.stdout, /100\/100/);
  } finally {
    removeDir(dir);
  }
});

test('audit fails a bare directory with actionable fixes', () => {
  const dir = tempDir();
  try {
    const result = forge(['audit', dir]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Create README\.md/);
    assert.match(result.stdout, /Add a LICENSE file/);
    assert.match(result.stdout, /\/100/);
  } finally {
    removeDir(dir);
  }
});

test('audit reports a missing publish workflow', () => {
  const dir = tempDir();
  try {
    writeCompleteFixture(dir);
    fs.rmSync(path.join(dir, '.github', 'workflows', 'publish.yml'));
    git(['init', '-b', 'main'], dir);
    const result = forge(['audit', dir]);
    assert.equal(result.status, 0, result.stdout);
    assert.match(result.stdout, /Add a publish-on-tag workflow/);
    assert.doesNotMatch(result.stdout, /100\/100/);
  } finally {
    removeDir(dir);
  }
});
