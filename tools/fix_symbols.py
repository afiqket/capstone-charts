from pathlib import Path

p = Path("qna.csv")

text = p.read_text(encoding="utf-8-sig")

replacements = {
    "â€“": "–",
    "â€”": "—",
    "â€˜": "‘",
    "â€™": "’",
    "â€œ": "“",
    "â€\x9d": "”",
    "â€¦": "…",
    "Â ": " ",
    "Â": "",
}

for bad, good in replacements.items():
    text = text.replace(bad, good)

p.write_text(text, encoding="utf-8-sig")

print("Fixed mojibake and saved as UTF-8.")