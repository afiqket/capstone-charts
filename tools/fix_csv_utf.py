from pathlib import Path

file = Path("new_charts.csv")

text = file.read_text(encoding="utf-8")
file.write_text(text, encoding="utf-8-sig")

print("Added UTF-8 signature to CSV.")