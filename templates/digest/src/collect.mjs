/**
 * @file Collect data from the GitHub API for the configured topic.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * Maximum number of items to fetch per run.
 */
const DEFAULT_PER_PAGE = 25;

/**
 * Read config from data/config.json or return defaults.
 * @returns {{ topic: string, perPage: number }}
 */
function loadConfig() {
  try {
    const raw = JSON.parse(
      readFileSync(join(ROOT, 'data', 'config.json'), 'utf-8'),
    );
    return {
      topic: raw.topic || 'ai',
      perPage: raw.perPage || DEFAULT_PER_PAGE,
    };
  } catch {
    return { topic: 'ai', perPage: DEFAULT_PER_PAGE };
  }
}

/**
 * Fetch trending repositories from the GitHub search API.
 *
 * @param {string} token - Optional GitHub personal access token for rate limit.
 * @param {number} [maxRetries=3] - Max retry attempts on failure.
 * @returns {Promise<Array<{repo: string, url: string, stars: number, language: string|null, description: string|null}>>}
 */
export async function fetchTrending(token, maxRetries = 3) {
  const { topic, perPage } = loadConfig();
  const searchQuery = `topic:${topic} sort:stars-desc`;
  const page = 1;

  /** @param {number} attempt */
  async function attempt(n) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': '{{SLUG}}-digest/0.1.0',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&per_page=${perPage}&page=${page}&sort=stars&order=desc`;

    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (res.status === 403 && n < maxRetries) {
      // Rate limited — retry with backoff
      await new Promise((r) => setTimeout(r, 1000 * 2 ** n));
      return attempt(n + 1);
    }
    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}: ${res.statusText}`);
    }

    const body = await res.json();
    assert(Array.isArray(body.items), 'Expected items array in response');

    return body.items.map((item) => ({
      repo: item.full_name,
      url: item.html_url,
      stars: item.stargazers_count,
      language: item.language || null,
      description: item.description || null,
    }));
  }

  return attempt(1);
}

export { loadConfig };