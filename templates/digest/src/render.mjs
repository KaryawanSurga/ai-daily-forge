/**
 * @file Render a digest from collected items.
 */

/**
 * @param {Array<{repo: string, url: string, stars: number, language: string|null, description: string|null}>} items
 * @param {{ date: string, total: number, comparedTo?: { items: Array<{repo: string, stars: number}> } }} meta
 * @returns {string} Markdown digest
 */
export function renderDigest(items, meta) {
  const lines = [];
  lines.push(`# Daily AI Digest — ${meta.date}`);
  lines.push('');
  lines.push(`${meta.total} trending ${meta.topic || 'AI'} repositories as of ${meta.date}.`);
  lines.push('');

  // Table
  lines.push('## Top repositories');
  lines.push('');
  lines.push('| # | Repository | Stars | Language | Description |');
  lines.push('|---|---|---|---|---|');
  items.forEach((item, i) => {
    const name = `[${item.repo}](${item.url})`;
    const stars = String(item.stars);
    const lang = item.language || '—';
    const desc = (item.description || '').slice(0, 100);
    lines.push(`| ${i + 1} | ${name} | ${stars} | ${lang} | ${desc} |`);
  });
  lines.push('');

  // Delta
  if (meta.comparedTo) {
    lines.push('## Delta vs previous snapshot');
    lines.push('');

    const prevRepos = new Map(meta.comparedTo.items.map((r) => [r.repo, r.stars]));
    const curRepos = new Map(items.map((r) => [r.repo, r.stars]));

    const gained = items.filter((r) => !prevRepos.has(r.repo));
    const lost = meta.comparedTo.items.filter((r) => !curRepos.has(r.repo));
    const changed = items
      .filter((r) => prevRepos.has(r.repo) && prevRepos.get(r.repo) !== r.stars)
      .sort((a, b) => (b.stars - (prevRepos.get(b.repo) || 0)) - (a.stars - (prevRepos.get(a.repo) || 0)));

    if (gained.length) {
      lines.push(`**New entries (+${gained.length}):** ${gained.map((r) => r.repo).join(', ')}`);
      lines.push('');
    }
    if (lost.length) {
      lines.push(`**Dropped (-${lost.length}):** ${lost.map((r) => r.repo).join(', ')}`);
      lines.push('');
    }
    if (changed.length) {
      lines.push('**Biggest star changes:**');
      for (const r of changed.slice(0, 5)) {
        const delta = r.stars - (prevRepos.get(r.repo) || 0);
        const sign = delta > 0 ? '+' : '';
        lines.push(`- ${r.repo}: ${sign}${delta} stars (${prevRepos.get(r.repo) || '?'} → ${r.stars})`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}