"""CLI tests for {{SNAKE}}."""

import pytest
from {{SNAKE}}.cli import main


class TestCLI:
    def test_file_not_found_exits_nonzero(self, monkeypatch):
        monkeypatch.setattr("sys.argv", ["{{SLUG}}", "/nonexistent_file_xyz.txt"])
        with pytest.raises(SystemExit) as exc:
            main()
        assert exc.value.code != 0

    def test_stdin_no_input(self, monkeypatch):
        monkeypatch.setattr("sys.argv", ["{{SLUG}}"])
        monkeypatch.setattr("sys.stdin", type("Stdin", (), {"read": lambda: ""})())
        with pytest.raises(SystemExit) as exc:
            main()
        assert exc.value.code != 0

    def test_stdin_input_works(self, monkeypatch, capsys):
        monkeypatch.setattr("sys.argv", ["{{SLUG}}"])
        monkeypatch.setattr(
            "sys.stdin", type("Stdin", (), {"read": lambda: "hello world test test test"})()
        )
        with pytest.raises(SystemExit) as exc:
            main()
        assert exc.value.code == 0
        captured = capsys.readouterr()
        assert "3" in captured.out  # unique words minus stopwords
        assert "test" in captured.out

    def test_json_output(self, monkeypatch, capsys):
        import json
        monkeypatch.setattr("sys.argv", ["{{SLUG}}", "--json"])
        monkeypatch.setattr(
            "sys.stdin",
            type("Stdin", (), {"read": lambda: "hello world test test test"})(),
        )
        with pytest.raises(SystemExit) as exc:
            main()
        assert exc.value.code == 0
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert data["words"] >= 4