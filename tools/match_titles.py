import csv
from pathlib import Path


LINKS_FILE = Path("links.csv")
LOOKUP_FILE = Path("lookup.csv")
OUTPUT_FILE = Path("matched_titles.csv")


def clean(value):
    return (value or "").strip()


def find_column(headers, target):
    for i, col in enumerate(headers):
        if clean(col).lower() == target.lower():
            return i
    raise ValueError(f"Column '{target}' not found. Available columns: {headers}")


def read_lookup(path):
    lookup = {}

    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)

        headers = next(reader)
        link_idx = find_column(headers, "link")
        title_idx = find_column(headers, "title")

        for row in reader:
            if not row:
                continue

            while len(row) <= max(link_idx, title_idx):
                row.append("")

            link = clean(row[link_idx])
            title = clean(row[title_idx])

            if link and link not in lookup:
                lookup[link] = title

    return lookup


def main():
    lookup = read_lookup(LOOKUP_FILE)

    with LINKS_FILE.open("r", encoding="utf-8-sig", newline="") as infile, \
         OUTPUT_FILE.open("w", encoding="utf-8-sig", newline="") as outfile:

        reader = csv.reader(infile)
        writer = csv.writer(outfile)

        headers = next(reader)
        link_idx = find_column(headers, "link")

        output_headers = list(headers)
        output_headers.append("title")
        writer.writerow(output_headers)

        last_link = ""

        for row in reader:
            # Important:
            # csv.reader gives [] for a fully empty line.
            # We convert it into an empty row instead of skipping it.
            if not row:
                row = [""]

            while len(row) < len(headers):
                row.append("")

            current_link = clean(row[link_idx])

            if current_link:
                last_link = current_link
                filled_link = current_link
            else:
                filled_link = last_link

            row[link_idx] = filled_link

            title = lookup.get(filled_link, "")

            writer.writerow(row + [title])

    print(f"Done. Output written to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()