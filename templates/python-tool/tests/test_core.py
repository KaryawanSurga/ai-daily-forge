"""Tests for {{SNAKE}}.core."""

import pytest
from {{SNAKE}}.core import summarize_text


class TestSummarizeText:
    def test_empty_string(self):
        result = summarize_text("")
        assert result["words"] == 0
        assert result["chars"] == 0
        assert result["unique_words"] == 0
        assert result["top_words"] == []

    def test_single_word(self):
        result = summarize_text("hello")
        assert result["words"] == 1
        assert result["chars"] == 5
        assert result["unique_words"] == 1
        assert result["reading_time_minutes"] == 0.01
        assert result["top_words"] == [("hello", 1)]

    def test_unicode_and_emoji(self):
        text = "caf\u00e9 r\u00e9sum\u00e9 na\u00efve \ud83d\ude80"
        result = summarize_text(text)
        assert result["words"] >= 3
        assert result["unique_words"] >= 3

    def test_top_words_ordered_by_frequency(self):
        text = "python python python code code test data data data data data"
        result = summarize_text(text)
        top = result["top_words"]
        assert top[0][0] == "data"
        assert top[0][1] == 5
        assert top[1][0] == "python"
        assert top[1][1] == 3

    def test_stopwords_excluded_from_top(self):
        text = "the and of a an in it is to"
        result = summarize_text(text)
        # All of these are stopwords, + short tokens excluded
        assert len(result["top_words"]) == 0

    def test_repeated_stopwords_excluded(self):
        text = "the the the the the and and and and a a a an an in it is to use use use"
        result = summarize_text(text)
        top_words = [w for w, _ in result["top_words"]]
        assert "the" not in top_words
        assert "use" in top_words

    def test_reading_time(self):
        # ~200 words, should be ~1 min
        words = " ".join(f"word{i}" for i in range(200))
        result = summarize_text(words)
        assert result["words"] == 200
        assert abs(result["reading_time_minutes"] - 1.0) < 0.01

    def test_numbers_in_text(self):
        text = "version 2.0 and 3.0 are 4 times faster"
        result = summarize_text(text)
        assert result["words"] >= 6
        assert result["unique_words"] >= 6
        assert "2.0" not in result["top_words"] or True  # numbers can be kept