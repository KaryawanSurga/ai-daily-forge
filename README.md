# AI Daily Forge

[![CI](https://github.com/KaryawanSurga/ai-daily-forge/actions/workflows/ci.yml/badge.svg)](https://github.com/KaryawanSurga/ai-daily-forge/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Ship one useful AI project a day — without gaming the graph.**

A zero-dependency CLI that turns the "commit every day" grind into a real production line: verify your environment, scaffold publish-ready projects, audit them before release, watch your actual contribution streak, and keep a ranked backlog of what to build next. Every feature exists to make *real* daily output easier — not to fabricate activity.

> Documentation guides are available in Bahasa Indonesia under [`docs/`](docs/):
> [operational playbook](docs/playbook.id.md) · [anti-patterns](docs/anti-patterns.id.md) · [distribution strategy](docs/distribution.id.md)

## Why

- Most "daily commit" advice produces noise: empty commits, README typos, version bumps. That hurts your profile instead of building it.
- The things that actually block a daily streak are boring and mechanical: wrong git email, a fork instead of a standalone repo, commits on a feature branch that nobody counts, pushing after midnight UTC.
- Starting a new project every day means repeating the same setup: package metadata, CI, tests, license, publish workflow.
- You need to know *why* a day shows no green square — not guess.

AI Daily Forge is the command-line missing piece: `forge doctor` finds the real reason your commits do not count, `forge new` scaffolds a project that is ready to publish on minute one, and `forge audit` scores publish-readiness before you announce it.

## Install

```sh
# run without installing
npx -y ai-daily-forge doctor

# or install globally
npm install -g ai-daily-forge
forge doctor
```

Requires Node >= 20. Uses git and (optionally) the GitHub CLI — both already on the machines of anyone doing this.

## Usage

The daily loop:

```sh
forge doctor                     # 1. can today's commits reach the graph?
forge ideas                      # 2. pick the next project from the ranked backlog
forge new mcp-server my-new-tool # 3. scaffold: files, CI, tests, git repo, first commit
cd my-new-tool && npm install    # 4. build for real
forge audit .                    # 5. score publish-readiness before pushing
forge log "shipped my-new-tool"  # 6. record what actually shipped
```

Then push and check your real streak:

```sh
forge streak                     # contribution heatmap from local git history
```

### Commands

| Command | What it does |
| --- | --- |
| `forge doctor` | Checks everything that decides whether commits count: identity, email linkage, fork status, default branch, timing window, templates. |
| `forge new <template> <slug>` | Scaffolds a publish-ready project (with `--title`, `--desc`, `--push`). |
| `forge audit [dir]` | Scores a repo 0–100 for publish-readiness with per-check fixes. |
| `forge streak [dir] [--days N]` | Real contribution heatmap computed from local git history, refs merged. |
| `forge log "<text>" [--kind fix]` | Appends today's honest entry to `daily-log/YYYY-MM-DD.md`. |
| `forge ideas [--category mcp] [--md]` | The ranked backlog, or its markdown table for a README/issue. |
| `forge templates` | Lists the shipped templates. |

Exit codes: `0` ok, `1` a problem was found, `2` bad usage — safe in scripts and CI.

### `forge doctor`

```text
  ok   node v22.23.2  (>= 20 required)
  ok   git version 2.49.0
  ok   gh version 2.7x
  ok   git user.name  KaryawanSurga
  ok   git user.email zainalutama01@gmail.com
  ok   zainalutama01@gmail.com is attached to your GitHub account.
  ok   standalone repository (commits are eligible).
  ok   branch main
  ok   safe window  commit between 07:00 and 23:59 local — maps to one date under both readings
```

Verified directly against GitHub's documentation and API: the email must be attached to your account, forks never count, only the default branch (or `gh-pages`) counts, and the timing window keeps UTC and local attribution aligned.

### `forge audit`

Weighted checks for README depth, LICENSE, CI, tests, package metadata, publish workflow, and remote signals (description, topics, fork status). CI runs `forge audit .` on itself so the score cannot regress.

## Templates

| Template | Language | What you get |
| --- | --- | --- |
| `mcp-server` | TypeScript | Production MCP server: stdio transport, tools, tests, CI + publish workflows, npm-ready metadata. |
| `digest` | JavaScript | Self-updating daily digest bot: cron-driven workflow that commits real data every day. |
| `python-tool` | Python | Zero-dependency Python CLI, uv-managed, PyPI-ready with CI + publish workflows. |
| `skill-pack` | Python | Agent skill pack: `SKILL.md`, validator script, references, examples. |

```sh
forge new mcp-server repo-stats --title "Repo Stats" --desc "MCP server that reports repo composition" --push
```

`--push` creates the public GitHub repo and pushes the first commit immediately, so the project is live — and countable — within a minute.

## Configuration

`forge.config.json` in the repo root or your cwd:

```json
{
  "author": "Your Name",
  "email": "you@example.com",
  "githubUser": "you",
  "license": "MIT"
}
```

Every key falls back to your git config, so the file is optional. `FORGE_CONFIG` can point to an alternative file.

## The backlog

`ideas.json` is a ranked backlog: each idea carries a category, effort tier, impact and star potential, and a registry target. `forge ideas` computes the ranking and prints the shortlist — the same list that produced the growing family of tools in the [KaryawanSurga](https://github.com/KaryawanSurga) portfolio.

## Philosophy

The contribution graph is a byproduct, never the goal. The forced anti-pattern list (from [`docs/anti-patterns.id.md`](docs/anti-patterns.id.md)):

- No empty commits, no date rewriting, no bot commit farms.
- One genuinely useful artifact per day: a tool, a release, an integration, a substantive doc.
- Maintenance counts if it ships: bug fixes with tests, version releases, real refactors.

## Development

```sh
npm test                     # 20 integration tests across all commands
npm run doctor               # environment preflight
npm run audit                # self-audit (must stay >= 85)
```

CI runs the suite on Node 20 and 22, then audits the repository itself. The publish workflow goes to npm on version tags.

## License

MIT — see [LICENSE](LICENSE).
