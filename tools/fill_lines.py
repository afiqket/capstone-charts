with open("input.txt", "r", encoding="utf-8") as f:
    lines = f.read().splitlines()

last = None
result = []

for line in lines:
    if line.strip():
        last = line
        result.append(line)
    else:
        result.append(last if last is not None else "")

with open("output.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(result))