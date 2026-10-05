"""CLI entry point for {{SLUG}}."""

import argparse
import sys
from typing import NoReturn
from {{SNAKE}}.core import summarize_text


def main() -> NoReturn:
    parser = argparse.ArgumentParser(
        description="{{DESCRIPTION}}",
    )
    parser.add_argument(
        "file",
        nargs="?",
        help="Path to a text file (reads from stdin if omitted)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output JSON instead of formatted table",
    )
    args = parser.parse_args()

    if args.file:
        try:
            with open(args.file, encoding="utf-8") as f:
                text = f.read()
        except FileNotFoundError:
            print(f"Error: file not found: {args.file}", file=sys.stderr)
            sys.exit(1)
        except PermissionError:
            print(f"Error: permission denied: {args.file}", file=sys.stderr)
            sys.exit(1)
    else:
        text = sys.stdin.read()
        if not text.strip():
            print("Error: no input provided (pipe text or specify a file)", file=sys.stderr)
            sys.exit(1)

    result = summarize_text(text)

    if args.json:
        import json
        json.dump(result, sys.stdout, indent=2)
        print()
    else:
        print()
        print("  File statistics")
        print(f"  Words:     {result['words']}")
        print(f"  Chars:     {result['chars']}")
        print(f"  Unique:    {result['unique_words']}")
        print(f"  Read time: {result['reading_time_minutes']:.1f} min")
        print(f"  Top words: {', '.join(f'{w} ({c})' for w, c in result['top_words'])}")
        print()

    sys.exit(0)