# {{TITLE}}

[![npm](https://img.shields.io/npm/v/{{SLUG}})](https://www.npmjs.com/package/{{SLUG}})
[![CI](https://github.com/{{GITHUB_USER}}/{{SLUG}}/actions/workflows/ci.yml/badge.svg)](https://github.com/{{GITHUB_USER}}/{{SLUG}}/actions/workflows/ci.yml)

{{DESCRIPTION}}

An MCP (Model Context Protocol) server that gives AI agents the ability to analyze repository structures, count files and lines, and understand codebase composition by extension.

## Why

Large codebases are opaque to AI agents — they cannot guess which files matter or how deep a directory goes. This MCP server lets any MCP-compatible client (Claude, Cline, and others) inspect a repo's structure with a single tool call, before deciding to read individual files.

## Install

```bash
npm install -g {{SLUG}}
```

Or use it as a local dependency:

```bash
npm install {{SLUG}}
```

## Usage

Add to your MCP client config (`claude_desktop_config.json` or `.mcp.json`):

```json
{
  "mcpServers": {
    "{{SLUG}}": {
      "command": "{{SLUG}}",
      "args": []
    }
  }
}
```

Then ask your AI agent:

```
/tool {{SLUG}} repo_stats path="/path/to/project"
```

Example output:

```json
{
  "totalFiles": 142,
  "totalLines": 28450,
  "byExtension": {
    ".ts": { "files": 48, "lines": 9600 },
    ".json": { "files": 23, "lines": 4600 }
  },
  "path": "/path/to/project",
  "extensionFilter": null
}
```

Filter by extension:

```json
{ "path": "/path/to/project", "extensions": [".ts", ".tsx"] }
```

## Features

- Recursive directory analysis (skips `node_modules`, `.git`, `.venv`)
- Count files, total lines, and breakdown by file extension
- Optional extension filter
- Error-handled (non-existent paths return clear errors)
- Graceful SIGINT/SIGTERM shutdown

## Configuration

No configuration needed. The server accepts tool arguments at call time.

## License

{{LICENSE}}