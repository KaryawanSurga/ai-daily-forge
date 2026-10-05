# PRD — AI Daily Forge

**Status:** v1.0.0 ready to ship
**Owner:** KaryawanSurga
**Last updated:** 2026-10-06

## 1. Summary

AI Daily Forge is a zero-dependency CLI that turns daily AI-project shipping into a repeatable production line: environment verification (`doctor`), project scaffolding (`new`), publish-readiness scoring (`audit`), real contribution streak measurement (`streak`), honest daily logging (`log`), and a ranked backlog (`ideas`). Every command exists to make real daily output easier — never to fabricate activity.

## 2. Problem

- Daily-commit advice degenerates into noise: empty commits, typo READMEs, fake activity that damages credibility.
- The mechanical blockers are invisible: wrong git email, a fork instead of a standalone repo, feature-branch commits that never count, pushes after the UTC/local date flips.
- Each new project repeats setup: metadata, CI, tests, license, publish workflow.
- There is no local, honest heatmap that answers "how many real commits did I make, and where?"

## 3. Target users

- Developers committing to a daily open-source habit.
- Builders producing a stream of AI/developer tools who need repeatable scaffolding.
- Anyone who wants a publish-readiness opinion before announcing a repo.

## 4. Goals (v1.0.0)

1. Diagnose every condition that decides whether commits appear on the contribution graph, with a verdict and fixes.
2. Scaffold complete projects from templates with real metadata, CI, tests, and git initialized on `main`.
3. Score repository publish-readiness 0–100 with per-check, actionable fixes — usable as a CI gate.
4. Compute a real contribution heatmap from local git history across repositories.
5. Keep a ranked backlog and turn it into a shortlist or markdown table.
6. Ship zero dependencies and run on Node >= 20 with only git (and optionally gh).

## 5. Non-goals

- Fabricating commits of any kind: empty commits, date rewriting, bot farms.
- Hosting, deployment, or registry publishing automation beyond the shipped publish workflow templates.
- GitHub API feature parity: the tool never replaces `gh`, it composes with it.
- GUI or web dashboard.

## 6. User stories

- As a developer, I want `forge doctor` to tell me exactly why last Friday shows no green square.
- As a builder, I want `forge new` to produce a repo that passes review on minute one.
- As a maintainer, I want `forge audit .` in CI so quality cannot silently regress.
- As a planner, I want `forge ideas` to rank the backlog and emit a README-ready table.
- As a diarist, I want `forge log` to capture what actually shipped, newest first.

## 7. Functional requirements

| ID | Requirement |
| --- | --- |
| FR1 | `doctor` checks Node, git, gh, identity (name/email), email-to-account linkage via gh, generic-email rejection, repository context (branch, remote, fork status, description, topics), UTC/local attribution alignment with a safe commit window, and template availability; exits 1 when problems exist. |
| FR2 | `new <template> <slug>` copies a template with placeholder substitution (`SLUG`, `SNAKE`, `TITLE`, `DESCRIPTION`, `YEAR`, `AUTHOR`, `EMAIL`, `GITHUB_USER`, `LICENSE`), handles `.tmpl` suffixes and templated path segments, and reports unresolved placeholders as template bugs. |
| FR3 | `new` initializes git on `main`, applies the configured identity, and creates the initial commit; `--push` creates the public GitHub repo and pushes. |
| FR4 | `new` refuses duplicate destinations, unknown templates, and invalid slugs with distinct exit codes. |
| FR5 | `audit [dir]` runs weighted checks (README depth/Install/Usage/license, LICENSE, .gitignore, CI, tests, package metadata, git repo, remote description/topics/not-fork) and prints a 0–100 score with fixes; exits 1 below 85. |
| FR6 | `streak [dir] [--days N] [--utc]` discovers repositories, counts commits once per sha across refs, renders a heatmap, and reports current/longest streaks, active days, commit totals, and per-repo counts. |
| FR7 | `log "<text>" [--kind] [--dir]` appends a dated, newest-first entry to `daily-log/YYYY-MM-DD.md`. |
| FR8 | `ideas [--category] [--md] [--limit]` ranks open ideas by impact/stars/effort/registry and prints a shortlist or markdown table. |
| FR9 | `templates` lists templates with language and description. |
| FR10 | Config resolves from `--config`, `FORGE_CONFIG`, cwd, then the forge root, falling back to git config values. |
| FR11 | Exit codes: 0 ok, 1 problem found, 2 usage error — stable for scripting. |

## 8. Non-functional requirements

- Zero runtime dependencies; Node >= 20; no install step to run.
- Windows, macOS, and Linux (no shell-specific behavior; `windowsHide` on all child processes).
- Every engine failure degrades gracefully (missing gh disables remote checks instead of crashing).
- Test suite runs on the built-in Node test runner; CI audits the repository on every push.
- No network calls except through the user's own git/gh binaries.

## 9. Success metrics

- Adoption as the pre-flight step in daily-commit workflows.
- Repositories containing `forge audit` in CI.
- Ideas backlog items moving to `done` at a steady cadence.
- npm installs and stars growing without marketing pushes.

## 10. Technical notes

- Single-file CLI (`bin/forge.mjs`) organized by command with shared `run()` process helpers that never throw.
- Templates carry `.template.json` metadata; the scaffolder walks, substitutes, and verifies leftovers.
- Audit weights total 104 locally; remote checks add 18 and are skipped when gh is unavailable, keeping CI deterministic.
- Streak counts each commit sha once even when reachable from multiple refs; dates use each commit's own timezone unless `--utc`.
- Colors auto-disable when stdout is not a TTY or `NO_COLOR` is set.

## 11. Release plan

- **v1.0.0** — doctor, new, audit, streak, log, ideas, templates; four templates; 20-test suite; CI self-audit; npm publish workflow (2026-10-06).
- **v1.1.0** — additional templates (CLI, GitHub Action), `forge release` (tag + notes + gh release), richer audit checks (coverage, package contents).
- **v1.2.0** — `forge sync` (GitHub API verification of pushed commits), weekly report from `daily-log`.

## 12. Open questions

- Should `doctor` offer an interactive fix mode for identity and email problems?
- Should audit integrate a `npm pack --dry-run` file-list check?
- Should templates be versioned and installable individually?
