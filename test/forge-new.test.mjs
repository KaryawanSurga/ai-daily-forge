import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { forge, git, removeDir, tempDir, writeConfig } from './helpers/forge.mjs';

test('new scaffolds a publish-ready project from a template', () => {
  const dir = tempDir();
  try {
    const config = writeConfig(dir);
    const result = forge([
      'new',
      'mcp-server',
      'demo-tool',
      '--config',
      config,
      '--title',
      'Demo Tool',
      '--desc',
      'A demo MCP server',
    ]);
    assert.equal(result.status, 0, result.stderr);

    const project = path.join(dir, 'demo-tool');
    assert.ok(fs.existsSync(path.join(project, 'package.json')));
    assert.ok(fs.existsSync(path.join(project, 'src', 'index.ts')));
    assert.ok(fs.existsSync(path.join(project, '.github', 'workflows', 'ci.yml')));

    const pkg = JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'demo-tool');
    assert.equal(pkg.description, 'A demo MCP server');
    assert.equal(pkg.bin['demo-tool'], './dist/index.js');

    const readme = fs.readFileSync(path.join(project, 'README.md'), 'utf8');
    assert.match(readme, /Demo Tool/);
    assert.match(readme, /tester\/demo-tool/);

    const leftovers = [];
    for (const file of ['package.json', 'README.md', 'src/index.ts', 'tsconfig.json']) {
      const text = fs.readFileSync(path.join(project, file), 'utf8');
      for (const match of text.matchAll(/\{\{[A-Z_]+\}\}/g)) {
        leftovers.push(`${file}: ${match[0]}`);
      }
    }
    assert.deepEqual(leftovers, []);

    assert.equal(git(['branch', '--show-current'], project).stdout.trim(), 'main');
    const log = git(['log', '--oneline'], project);
    assert.equal(log.status, 0);
    assert.match(log.stdout, /initial scaffold of demo-tool/);
  } finally {
    removeDir(dir);
  }
});

test('new substitutes the snake-case variable in file paths', () => {
  const dir = tempDir();
  try {
    const config = writeConfig(dir);
    const result = forge(['new', 'python-tool', 'my-cool-tool', '--config', config]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(fs.existsSync(path.join(dir, 'my-cool-tool', 'src', 'my_cool_tool', '__main__.py')));
  } finally {
    removeDir(dir);
  }
});

test('new refuses duplicates, unknown templates, and bad slugs', () => {
  const dir = tempDir();
  try {
    const config = writeConfig(dir);
    assert.equal(forge(['new', 'digest', 'dupe', '--config', config]).status, 0);

    const again = forge(['new', 'digest', 'dupe', '--config', config]);
    assert.equal(again.status, 1);
    assert.match(again.stderr, /destination already exists/);

    const unknown = forge(['new', 'nope', 'thing', '--config', config]);
    assert.equal(unknown.status, 2);
    assert.match(unknown.stderr, /unknown template "nope"/);

    const badSlug = forge(['new', 'digest', 'Bad Slug', '--config', config]);
    assert.equal(badSlug.status, 2);
    assert.match(badSlug.stderr, /invalid slug/);
  } finally {
    removeDir(dir);
  }
});
