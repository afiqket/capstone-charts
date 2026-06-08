from pathlib import Path

file_path = Path("duplicate_text.txt")

seen = set()
unique_lines = []

with file_path.open("r", encoding="utf-8") as f:
    for line in f:
        clean_line = line.rstrip("\n")

        if clean_line not in seen:
            seen.add(clean_line)
            unique_lines.append(clean_line)

with file_path.open("w", encoding="utf-8") as f:
    f.write("\n".join(unique_lines))

print("Duplicates removed from duplicate_text.txt")