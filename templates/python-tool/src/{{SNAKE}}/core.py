"""Core text analysis functions for {{SLUG}}.

.. function:: summarize_text(text: str) -> dict
    :returns: ``{"words", "chars", "unique_words", "reading_time_minutes", "top_words"}``
"""

from collections import Counter
import re


# Common English stopwords to exclude from top words.
_STOPWORDS: set[str] = {
    "a", "an", "the", "and", "or", "but", "if", "because", "as", "until",
    "while", "of", "at", "by", "for", "with", "about", "against", "between",
    "into", "through", "during", "before", "after", "above", "below", "to",
    "from", "up", "down", "in", "out", "on", "off", "over", "under", "again",
    "further", "then", "once", "here", "there", "when", "where", "why", "how",
    "all", "each", "every", "both", "few", "more", "most", "other", "some",
    "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
    "very", "just", "also", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "having", "do", "does", "did", "doing", "will",
    "would", "shall", "should", "may", "might", "can", "could", "must",
    "need", "dare", "ought", "used", "it", "its", "this", "that", "these",
    "those", "i", "me", "my", "myself", "we", "us", "our", "ourselves",
    "you", "your", "yours", "yourself", "he", "him", "his", "himself",
    "she", "her", "hers", "herself", "they", "them", "their", "theirs",
    "themselves", "what", "which", "who", "whom", "whose", "any", "anyone",
    "anything", "everyone", "everything", "nothing", "none", "somebody",
    "something", "someone", "each", "either", "neither", "both", "many",
    "several", "few", "much", "little", "no", "not", "never", "always",
    "often", "sometimes", "usually", "perhaps", "maybe", "please", "yes",
    "no", "hello", "hi",
}


def summarize_text(text: str) -> dict:
    """Analyze a text string and return summary statistics.

    Args:
        text: The input text to analyze.

    Returns:
        A dict with keys:
        - ``words``: total word count
        - ``chars``: total character count
        - ``unique_words``: number of unique words (case-insensitive)
        - ``reading_time_minutes``: estimated reading time at 200 wpm
        - ``top_words``: list of (word, count) tuples for the top 5 non-stopword words
    """
    chars = len(text)
    tokens = re.findall(r"[a-zA-Z0-9']+(?:[-'][a-zA-Z0-9]+)*", text)
    words = len(tokens)

    # Unique (case-insensitive, stopwords excluded)
    lowered = [t.lower() for t in tokens]
    unique = len({w for w in lowered if w not in _STOPWORDS})

    # Reading time
    reading_time = words / 200.0  # minutes at 200 wpm

    # Top words (exclude stopwords)
    filtered = [w for w in lowered if w not in _STOPWORDS and len(w) > 1]
    counter = Counter(filtered)
    top = counter.most_common(5)

    return {
        "words": words,
        "chars": chars,
        "unique_words": unique,
        "reading_time_minutes": round(reading_time, 2),
        "top_words": [(word, count) for word, count in top],
    }