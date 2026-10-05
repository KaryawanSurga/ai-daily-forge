---
name: {{SLUG}}
description: Use when asked to audit a repository for publish-readiness, check if a project is ready for public release, or review codebase hygiene before publishing.
---

# {{TITLE}}

Audits a local repository against a publish-readiness checklist: README completeness, license, CI, tests, metadata, and SEO signals.

## When to use

- The user says "is this ready to publish?", "audit my repo", "check if I can push this", or "review before release"
- Before shipping any open-source project to npm/PyPI/GitHub
- When the user asks you to verify a project's hygiene

NEVER use this skill for:
- Code review of logic or correctness
- Security vulnerability scanning
- Performance optimization

## Procedure

1. **Collect files.** Read these files from the repository root (return clean errors if missing, DO NOT stop on first missing file):
   - `README.md`
   - `LICENSE`
   - `.gitignore`
   - Any `.github/workflows/*.yml` or `.github/workflows/*.yaml`
   - `package.json` (if TypeScript/JavaScript) or `pyproject.toml` (if Python)
   - Test files under `test/`, `tests/`, `__tests__/`, or files matching `*.test.*` / `*.spec.*`

2. **Score each dimension** on a pass/fail basis. Record clear evidence (file path, excerpt). The dimensions in `references/checklist.md` are the authoritative list.

3. **Calculate a readiness score.** Count passing items / total items. Present as a percentage.

4. **Report in this EXACT format:**

```
## Publish-readiness: [SCORE]%

### Passed
- [item] — [evidence]

### Failed (fix order: importance desc)
- [ ] [what] → [exact fix]

### Notes
- [any context, e.g. "no CI found at all", "README is only 200 chars"]
```

5. If the score is below 60%, flag it with a WARNING line at the top.

## Rules

- Be specific. Instead of "README needs work" say "README has no Install section and is only 200 characters — expand to 1200+ chars."
- never suggest adding dependencies or changing architecture.
- Do not modify any files. This is a read-only audit.
- The checklist in `references/checklist.md` is the canonical reference — update it there, not here, if you find a new dimension.

## Verification

- Re-run this skill after fixes. Verify each previously-failed item now passes.
- The score must increase or the fixes are incomplete.
- If the score is 100%, the repo is ready for public release.