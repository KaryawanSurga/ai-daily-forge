import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FORGE = path.join(ROOT, 'bin', 'forge.mjs');
export const TEMPLATES = path.join(ROOT, 'templates');

export function forge(args, opts = {}) {
  return spawnSync(process.execPath, [FORGE, ...args], { encoding: 'utf8', ...opts });
}

export function git(args, cwd) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

export function tempDir(prefix = 'forge-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

export function writeConfig(dir, overrides = {}) {
  const file = path.join(dir, 'forge.config.json');
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        author: 'Test Author',
        email: 'test@example.com',
        githubUser: 'tester',
        templatesDir: TEMPLATES,
        outputDir: dir,
        ideasFile: path.join(ROOT, 'ideas.json'),
        ...overrides,
      },
      null,
      2,
    ),
  );
  return file;
}
