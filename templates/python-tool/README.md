# {{TITLE}}

[![PyPI](https://img.shields.io/pypi/v/{{SLUG}})](https://pypi.org/project/{{SLUG}}/)
[![CI](https://github.com/{{GITHUB_USER}}/{{SLUG}}/actions/workflows/ci.yml/badge.svg)](https://github.com/{{GITHUB_USER}}/{{SLUG}}/actions/workflows/ci.yml)

{{DESCRIPTION}}

A zero-dependency Python tool for quick text analysis — word count, unique vocabulary, reading time, and frequency analysis. No external packages required.

## Why

Reading a file's summary before diving deep saves time. This CLI gives you the key stats of any text file in one command: word count, unique words, estimated reading time, and the most frequent terms — all without installing anything beyond Python 3.10+.

## Install

```bash
uv tool install {{SLUG}}
# or
pipx install {{SLUG}}
# or
pip install {{SLUG}}
```

## Usage

```bash
# Analyze a file
{{SLUG}} README.md

# Pipe text directly
cat article.txt | {{SLUG}}

# JSON output for scripting
{{SLUG}} report.md --json
```

Example output:

```
┌────────────────────────────────────────────┐
│  File: README.md                           │
│  Words: 245      Characters: 1,892         │
│  Unique: 89      Reading time: 1.2 min     │
│                                            │
│  Top words:                                │
│    1. install          (12)                │
│    2. {{SLUG}}         (8)                 │
│    3. usage            (6)                 │
│    4. tool             (5)                 │
│    5. json             (4)                 │
└────────────────────────────────────────────┘
```

## Features

- File or stdin input
- Word count, character count, unique vocabulary
- Reading time estimate (200 wpm)
- Top 5 most frequent words (English stopwords excluded)
- `--json` flag for machine-readable output
- Error handling: non-existent files return meaningful errors with non-zero exit codes

## Configuration

No configuration required. Pass `--help` for all flags.

## License

{{LICENSE}}