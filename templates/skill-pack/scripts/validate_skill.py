#!/usr/bin/env python3
"""Validate a SKILL.md file for format compliance.

Checks:
- Frontmatter YAML has required keys (name, description)
- name matches parent directory name
- Body has required sections (## When to use, ## Procedure, ## Rules, ## Verification)
- File size within limit (500 lines)
- All referenced file paths actually exist

Exit 0 on pass, 1 on fail with specific error messages.
"""

import os
import re
import sys
from pathlib import Path


def parse_frontmatter(text: str):
    """Parse YAML frontmatter between --- markers.

    Uses a minimal parser (no PyYAML dependency).
    Returns dict or None if parsing fails.
    """
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return None
    end = 1
    while end < len(lines) and lines[end].strip() != "---":
        end += 1
    if end >= len(lines):
        return None

    front = {}
    for line in lines[1:end]:
        line = line.strip()
        if not line:
            continue
        match = re.match(r"^(\w[\w_-]*)\s*:\s*(.+)$", line)
        if match:
            front[match.group(1)] = match.group(2).strip().strip('"')
    return front


def validate_skill(skill_path: str) -> int:
    """Validate a SKILL.md file. Returns 0 on success, 1 on failure."""
    path = Path(skill_path)
    if not path.exists():
        print(f"FAIL: SKILL.md not found at {skill_path}")
        return 1

    text = path.read_text("utf-8")
    lines = text.split("\n")
    errors: list[str] = []
    dir_name = path.parent.name

    # 1. Line count
    if len(lines) > 500:
        errors.append(f"File too long: {len(lines)} lines (max 500)")

    # 2. Frontmatter
    front = parse_frontmatter(text)
    if front is None:
        errors.append("Missing or malformed frontmatter (must start with --- and end with ---)")
    else:
        if "name" not in front:
            errors.append("Frontmatter missing required key: name")
        else:
            skill_name = front["name"]
            if skill_name != dir_name:
                errors.append(
                    f'Frontmatter name "{skill_name}" does not match directory name "{dir_name}"',
                )
        if "description" not in front:
            errors.append("Frontmatter missing required key: description")
        elif not front["description"].startswith("Use when"):
            errors.append('description should start with "Use when" (skill trigger convention)')

    # 3. Required sections
    required_sections = [
        "## When to use",
        "## Procedure",
        "## Rules",
        "## Verification",
    ]
    for section in required_sections:
        result = re.search(rf"^{re.escape(section)}\s*$", text, re.MULTILINE)
        if not result:
            errors.append(f"Missing required section: {section}")

    # 4. Referenced paths exist
    refs = re.findall(r"`([^`]+)`", text)
    for ref in refs:
        ref_path = path.parent / ref
        # Only check paths that look like relative file refs
        if "/" in ref or ref.endswith(".md") or ref.endswith(".py"):
            if not ref_path.exists():
                errors.append(f"Referenced file does not exist: {ref}")

    if errors:
        print(f"\nFAIL: {skill_path}")
        for e in errors:
            print(f"  - {e}")
        print()
        return 1

    print(f"\nOK: {skill_path} ({len(lines)} lines, {len(front or {})} frontmatter keys)")
    return 0


def main():
    skill_path = sys.argv[1] if len(sys.argv) > 1 else "SKILL.md"
    return validate_skill(skill_path)


if __name__ == "__main__":
    sys.exit(main())