#!/usr/bin/env node
/**
 * @file Orchestrator: collect → render → write + update README.
 */

import { readFileSync, existsSync, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync as existsSync_ } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchTrending } from './collect.mjs';
import { renderDigest } from './render.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const DIGEST_DIR = join(ROOT, 'digests');

/** Load previous snapshot for comparison. */
async function loadPrevious() {
  const path = join(DATA_DIR, 'latest.json');
  if (!existsSync_(path)) return null;
  const raw = await readFile(path, 'utf-8');
  return JSON.parse(raw);
}

/** Load config. */
function loadConfig() {
  const path = join(ROOT, 'data', 'config.json');
  if (existsSync_(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
  return { topic: 'ai', perPage: 25 };
}

/** Format today's date as YYYY-MM-DD (local). */
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Update README between markers. */
async function updateReadme(digestMarkdown) {
  const readmePath = join(ROOT, 'README.md');
  const readme = await readFile(readmePath, 'utf-8');
  const markerStart = '<!-- DIGEST:START -->';
  const markerEnd = '<!-- DIGEST:END -->';
  const startIdx = readme.indexOf(markerStart);
  const endIdx = readme.indexOf(markerEnd);

  if (startIdx === -1 || endIdx === -1) {
    console.error('Missing DIGEST markers in README.md — cannot inject digest.');
    return;
  }

  const before = readme.slice(0, startIdx + markerStart.length);
  const after = readme.slice(endIdx);
  const updated = `${before}\n\n${digestMarkdown}\n\n${after}`;
  await writeFile(readmePath, updated, 'utf-8');
}

async function main() {
  const token = process.env.GITHUB_TOKEN || '';
  const date = today();

  try {
    const items = await fetchTrending(token);
    const previous = await loadPrevious();

    const meta = {
      date,
      total: items.length,
      topic: loadConfig().topic,
    };

    if (previous) {
      meta.comparedTo = {
        items: previous.items.map((r) => ({ repo: r.repo, stars: r.stars })),
      };
    }

    const digest = renderDigest(items, meta);

    // Write data snapshot
    await mkdir(DATA_DIR, { recursive: true });
    await mkdir(DIGEST_DIR, { recursive: true });

    const dataPath = join(DATA_DIR, `${date}.json`);
    await writeFile(dataPath, JSON.stringify(items, null, 2), 'utf-8');
    await writeFile(join(DATA_DIR, 'latest.json'), JSON.stringify({ date, items }, null, 2), 'utf-8');

    // Write digest
    const digestPath = join(DIGEST_DIR, `${date}.md`);
    await writeFile(digestPath, digest, 'utf-8');

    // Update README
    await updateReadme(digest);

    console.log(`Digest for ${date} written (${items.length} items).`);
  } catch (err) {
    console.error('Failed to generate digest:', err.message);
    process.exit(1);
  }
}

main();