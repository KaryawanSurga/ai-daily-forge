# Changelog

All notable changes to AI Daily Forge are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-06

### Added

- `forge doctor`: verifies Node, git, gh, git identity, email-to-account linkage, fork status, default branch, discovery metadata, UTC/local attribution with a safe commit window, and template availability.
- `forge new <template> <slug>`: scaffolds a publish-ready project with placeholder substitution, git initialized on `main`, an initial commit, and optional `--push` to create the GitHub repo.
- `forge audit [dir]`: weighted 0–100 publish-readiness score with per-check fixes; exits non-zero below 85 so it can gate CI.
- `forge streak [dir]`: real contribution heatmap from local git history with current/longest streaks, active days, commit totals, and per-repo breakdown.
- `forge log "<text>"`: dated, newest-first daily log entries under `daily-log/`.
- `forge ideas`: ranked backlog shortlist or markdown table, filterable by category.
- `forge templates`: template listing with language and description.
- Four templates: `mcp-server` (TypeScript MCP server), `digest` (daily data bot), `python-tool` (uv-managed Python CLI), `skill-pack` (agent skill pack).
- 20 integration tests running the CLI end to end on the Node built-in test runner.
- CI that runs the suite on Node 20 and 22 and audits the repository itself.
- Publish workflow for npm on version tags.

### Fixed

- `forge streak` crashed with a temporal-dead-zone `ReferenceError` because a local `run` counter shadowed the `run()` process helper.
- `forge audit [dir]` queried remote metadata in the current directory instead of the audited one.

[1.0.0]: https://github.com/KaryawanSurga/ai-daily-forge/releases/tag/v1.0.0
