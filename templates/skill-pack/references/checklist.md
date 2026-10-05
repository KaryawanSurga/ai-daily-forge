# Publish-readiness checklist

## README
- [ ] Has H1 title (`# Title`)
- [ ] Contains a description sentence (first paragraph)
- [ ] Has `## Install` section
- [ ] Has `## Usage` section with runnable examples
- [ ] Has `## License` or mentions license
- [ ] No dangling `TODO` markers
- [ ] Total length > 1500 characters

## Package metadata
- [ ] `package.json` or `pyproject.toml` exists
- [ ] Has `description` field (< 160 chars)
- [ ] Has `keywords` (8-12)
- [ ] Has `license` field

## Legal
- [ ] `LICENSE` file exists with full text
- [ ] Copyright year in LICENSE is current

## DevOps
- [ ] `.gitignore` exists
- [ ] CI workflow (`.github/workflows/ci.yml` or similar)
- [ ] Publish/release workflow exists
- [ ] CI runs tests, not just linting

## Code quality
- [ ] At least one test file exists (under `test/`, `tests/`, or `*.test.*`)
- [ ] Tests pass locally
- [ ] No `console.log` / `print` debugging statements left in
- [ ] No `.only` / `skip` left in test files

## GitHub
- [ ] Repository description set
- [ ] Repository topics set (3+)
- [ ] Repository is not a fork
- [ ] README renders correctly on github.com

## Distribution
- [ ] Published to registry (npm/PyPI)
- [ ] Package name is not taken
- [ ] Version follows semver
- [ ] Provenance/trusted publishing configured