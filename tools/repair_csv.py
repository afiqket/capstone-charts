from pathlib import Path

p = Path("qna.csv")

raw = p.read_bytes()

try:
    fixed = raw.decode("utf-8-sig")
    print("Already valid UTF-8.")
except UnicodeDecodeError:
    broken_text = raw.decode("latin-1")
    fixed = broken_text.encode("latin-1").decode("utf-8", errors="replace")
    print("Repaired mojibake.")

backup = p.with_suffix(".backup.csv")
backup.write_bytes(raw)

p.write_text(fixed, encoding="utf-8-sig")

print(f"Backup saved as: {backup}")
print("Fixed file saved as UTF-8.")