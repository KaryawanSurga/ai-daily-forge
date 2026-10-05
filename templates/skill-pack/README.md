# {{TITLE}}

{{DESCRIPTION}}

A packaged skill for AI assistants (Claude, etc.) that enforces a rigorous pre-publish audit checklist — README completeness, license, CI, tests, metadata, and SEO signals.

## Install

Clone or copy this directory into your assistant's skills folder:

```bash
# Claude Desktop / cli
cp -r {{SLUG}} ~/.claude/skills/

# Or just reference the SKILL.md directly in your project
```

Then validate:

```bash
python scripts/validate_skill.py
```

## Contents

| File | Purpose |
|---|---|
| `SKILL.md` | The skill definition: when to use, procedure, rules, verification |
| `scripts/validate_skill.py` | Standalone validator — checks SKILL.md integrity |
| `references/checklist.md` | Detailed publish-readiness checklist |
| `examples/` | Request/output examples |

## Usage

Ask your AI assistant to "audit this repo for publish-readiness" — the skill will check:

- [ ] README has title, description, install section, usage section, license section
- [ ] LICENSE file is present
- [ ] .gitignore is present
- [ ] CI workflow is present
- [ ] Tests exist and are runnable
- [ ] Package metadata (description, keywords) is set
- [ ] No dangling TODOs or placeholders

## License

{{LICENSE}}