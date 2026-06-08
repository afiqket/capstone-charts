import csv
import re


TITLES_TXT = "titles.txt"
NEW_CHARTS_CSV = "new_charts.csv"
TITLE_COLUMN = "title"


def normalize_title(title: str) -> str:
    title = title.strip().casefold()

    # Remove symbols/punctuation, keep only letters, numbers, and spaces
    title = re.sub(r"[^\w\s]", "", title)

    # Normalize multiple spaces into one space
    title = re.sub(r"\s+", " ", title).strip()

    return title


def read_titles_txt(path: str) -> dict[str, str]:
    titles = {}

    with open(path, "r", encoding="utf-8-sig") as f:
        for line in f:
            original = line.strip()
            normalized = normalize_title(original)

            if normalized:
                titles[normalized] = original

    return titles


def read_titles_from_csv(path: str, title_column: str) -> dict[str, str]:
    titles = {}

    with open(path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        if title_column not in reader.fieldnames:
            raise ValueError(
                f"Column '{title_column}' not found in {path}. "
                f"Available columns: {reader.fieldnames}"
            )

        for row in reader:
            original = row.get(title_column, "").strip()
            normalized = normalize_title(original)

            if normalized:
                titles[normalized] = original

    return titles


def main():
    txt_titles = read_titles_txt(TITLES_TXT)
    csv_titles = read_titles_from_csv(NEW_CHARTS_CSV, TITLE_COLUMN)

    in_txt_not_csv = sorted(set(txt_titles) - set(csv_titles))
    in_csv_not_txt = sorted(set(csv_titles) - set(txt_titles))

    print("\nTitles in titles.txt but NOT in new_charts.csv:")
    print("-" * 60)
    if in_txt_not_csv:
        for key in in_txt_not_csv:
            print(txt_titles[key])
    else:
        print("None")

    print("\nTitles in new_charts.csv but NOT in titles.txt:")
    print("-" * 60)
    if in_csv_not_txt:
        for key in in_csv_not_txt:
            print(csv_titles[key])
    else:
        print("None")


if __name__ == "__main__":
    main()