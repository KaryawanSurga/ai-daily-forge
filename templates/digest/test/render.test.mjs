import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderDigest } from '../src/render.mjs';

const sampleItems = [
  { repo: 'user/a', url: 'https://github.com/user/a', stars: 100, language: 'TypeScript', description: 'First tool' },
  { repo: 'user/b', url: 'https://github.com/user/b', stars: 50, language: 'Python', description: 'Second tool' },
];

describe('renderDigest', () => {
  it('produces a table with correct header row', () => {
    const md = renderDigest(sampleItems, { date: '2026-09-16', total: 2 });
    assert(md.includes('# Daily AI Digest — 2026-09-16'));
    assert(md.includes('| # | Repository | Stars | Language | Description |'));
    assert(md.includes('user/a'));
    assert(md.includes('100'));
  });

  it('includes description truncated to 100 chars', () => {
    const items = [
      { repo: 'user/c', url: '#', stars: 10, language: null, description: 'x'.repeat(200) },
    ];
    const md = renderDigest(items, { date: '2026-09-16', total: 1 });
    // The description in the table should be <= 100 chars
    const tableRow = md.split('\n').find((l) => l.startsWith('| 1 |'));
    assert(tableRow);
    const parts = tableRow.split('|');
    const desc = parts[4].trim();
    assert(desc.length <= 100, `Description should be truncated: ${desc.length} chars`);
  });

  it('shows delta when comparedTo is provided', () => {
    const previous = {
      items: [
        { repo: 'user/a', stars: 100 },
      ],
    };
    // New item 'b' appeared, no items dropped
    const md = renderDigest(sampleItems, {
      date: '2026-09-17',
      total: 2,
      comparedTo: previous,
    });
    assert(md.includes('New entries'));
    assert(md.includes('user/b'));
  });

  it('shows dropped repos in delta', () => {
    const previous = {
      items: [
        { repo: 'user/a', stars: 100 },
        { repo: 'user/old', stars: 10 },
      ],
    };
    const md = renderDigest(sampleItems, {
      date: '2026-09-17',
      total: 2,
      comparedTo: previous,
    });
    assert(md.includes('Dropped'));
    assert(md.includes('user/old'));
  });

  it('handles empty items', () => {
    const md = renderDigest([], { date: '2026-09-16', total: 0 });
    assert(md.includes('0 trending'));
    // Table should be empty except for header
  });

  it('handles no previous snapshot gracefully', () => {
    const md = renderDigest(sampleItems, { date: '2026-09-16', total: 2 });
    assert(!md.includes('Delta'));
  });
});