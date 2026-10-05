# {{TITLE}}

{{DESCRIPTION}}

A self-updating daily digest bot. Every day at 05:00 WIB (22:00 UTC), this project runs a scheduled GitHub Action that collects the fastest-growing GitHub repositories in your chosen topic, produces a Markdown digest with a table and a delta section, and commits it to the repo.

The commit author can be **you** (if you set secrets) — so every automated run also counts as a contribution on your profile.

## Why

Staying on top of the AI tooling landscape is impossible manually. This bot does it for you and builds a public, browsable dataset of daily snapshots that anyone can use.

## How it works

```
┌─────────────┐    ┌──────────────┐    ┌────────────┐    ┌──────────┐
│ GitHub API  │───>│ collect.mjs  │───>│ render.mjs │───>│ digest/  │
│ (search)    │    │              │    │             │    │ YYYY-MM-DD.md
│             │    │ writes       │    │             │    │ data/    │
│             │    │ data/latest  │    │             │    │ latest   │
└─────────────┘    └──────────────┘    └────────────┘    └──────────┘
```

## Setup

1. Fork this repo or create your own from the template.
2. Configure the topic in `data/config.json` (default: "ai").
3. Set repository secrets:
   - `GIT_AUTHOR_NAME` — your GitHub display name
   - `GIT_AUTHOR_EMAIL` — your GitHub-verified email (otherwise commits won't count)
   - `GITHUB_TOKEN` — optional, same as the default; add for higher rate limit
4. Push to `main`. The scheduled Action runs daily at 22:00 UTC.

> **Important:** The commit only counts toward your contribution graph if `GIT_AUTHOR_EMAIL` is set to an address verified on your GitHub account. Without these secrets, the default `github-actions[bot]` author will NOT appear on your graph.

## Data format

Each day produces:

- `data/YYYY-MM-DD.json` — full snapshot from the API
- `digests/YYYY-MM-DD.md` — human-readable Markdown digest
- `data/latest.json` — always overwritten with the most recent snapshot

The digest is also injected into `README.md` between `<!-- DIGEST:START -->` and `<!-- DIGEST:END -->` markers.

### JSON schema

```json
{
  "date": "2026-09-16",
  "total": 25,
  "items": [
    {
      "repo": "owner/name",
      "url": "https://github.com/owner/name",
      "stars": 1234,
      "language": "Python",
      "description": "A tool that ..."
    }
  ]
}
```

## License

{{LICENSE}}