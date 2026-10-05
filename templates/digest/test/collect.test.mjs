import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';

// We'll mock fetch globally and test collect.mjs
const mockFetch = mock.fn();
globalThis.fetch = mockFetch;

// Import after mock
const { fetchTrending } = await import('../src/collect.mjs');

/** Helper: build a fake GitHub search response. */
function mockResponse(items) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ items, total_count: items.length }),
  };
}

describe('fetchTrending', () => {
  before(() => {
    mockFetch.mock.reset();
  });

  it('parses a valid response into structured items', async () => {
    mockFetch.mock.mockImplementation(() =>
      Promise.resolve(
        mockResponse([
          {
            full_name: 'owner/repo1',
            html_url: 'https://github.com/owner/repo1',
            stargazers_count: 123,
            language: 'Python',
            description: 'A great tool',
          },
        ]),
      ),
    );

    const items = await fetchTrending('test-token');
    assert.equal(items.length, 1);
    assert.equal(items[0].repo, 'owner/repo1');
    assert.equal(items[0].stars, 123);
    assert.equal(items[0].language, 'Python');
  });

  it('retries on 403 then succeeds', async () => {
    let count = 0;
    mockFetch.mock.mockImplementation(() => {
      count++;
      if (count === 1) {
        return Promise.resolve({ ok: false, status: 403, statusText: 'Forbidden' });
      }
      return Promise.resolve(
        mockResponse([
          {
            full_name: 'owner/repo2',
            html_url: 'https://github.com/owner/repo2',
            stargazers_count: 456,
          },
        ]),
      );
    });

    const items = await fetchTrending('test-token');
    assert.equal(items.length, 1);
    assert(count >= 2, 'should have retried at least once');
  });

  it('throws on non-403 failure after retries', async () => {
    mockFetch.mock.mockImplementation(() =>
      Promise.resolve({ ok: false, status: 500, statusText: 'Server Error' }),
    );

    await assert.rejects(() => fetchTrending('test-token', 1));
  });

  it('throws on invalid response shape', async () => {
    mockFetch.mock.mockImplementation(() =>
      Promise.resolve({ ok: true, status: 200, json: async () => ({ notItems: true }) }),
    );

    await assert.rejects(() => fetchTrending('test-token'));
  });
});