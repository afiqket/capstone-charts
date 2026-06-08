import argparse
import csv
import os
import re
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError


def read_urls(path: Path) -> list[str]:
    urls = []

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()

        # Skip blank lines
        if not line:
            continue

        # Skip comments
        if line.startswith("#"):
            continue

        urls.append(line)

    return urls


def clean_observable_title(title: str) -> str:
    """
    Example:
    IA commentary July 2023 / Yonsei University | Observable

    Becomes:
    IA commentary July 2023
    """

    title = title.strip()

    # Remove "| Observable"
    title = re.sub(r"\s*\|\s*Observable\s*$", "", title).strip()

    # Remove anything after "|"
    title = title.split("|")[0].strip()

    # Remove author/team after " / "
    title = title.split(" / ")[0].strip()

    return title


def get_page_title(page, url: str) -> tuple[str, str]:
    page.goto(url, wait_until="domcontentloaded", timeout=60000)

    # Observable sometimes updates the title after initial load
    try:
        page.wait_for_load_state("networkidle", timeout=10000)
    except PlaywrightTimeoutError:
        pass

    full_title = page.title().strip()

    # Fallback if page.title() is empty or useless
    if not full_title or full_title.lower() in {"observable", "observablehq"}:
        og_title = page.locator('meta[property="og:title"]').get_attribute("content")
        if og_title:
            full_title = og_title.strip()

    clean_title = clean_observable_title(full_title)

    return full_title, clean_title


def save_row(writer, file, row: dict) -> None:
    writer.writerow(row)

    # Save immediately after each row
    file.flush()
    os.fsync(file.fileno())


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "input_file",
        nargs="?",
        default="websites.txt",
        help="Text file containing URLs, one per line. Default: websites.txt",
    )

    parser.add_argument(
        "-o",
        "--output",
        default="titles.csv",
        help="Output CSV file name. Default: titles.csv",
    )

    parser.add_argument(
        "--headed",
        action="store_true",
        help="Run browser visibly instead of headless",
    )

    args = parser.parse_args()

    input_path = Path(args.input_file)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"Input file not found: {input_path}")
        return

    urls = read_urls(input_path)

    if not urls:
        print("No URLs found.")
        return

    fieldnames = ["url", "clean_title", "full_title", "status", "error"]

    # Append mode.
    # If file already exists, new rows are added to the bottom.
    file_already_exists = output_path.exists() and output_path.stat().st_size > 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not args.headed)
        context = browser.new_context()
        page = context.new_page()

        with output_path.open("a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)

            # Only write header if CSV is new/empty
            if not file_already_exists:
                writer.writeheader()
                f.flush()
                os.fsync(f.fileno())

            for i, url in enumerate(urls, start=1):
                print(f"[{i}/{len(urls)}] {url}")

                try:
                    full_title, clean_title = get_page_title(page, url)

                    save_row(
                        writer,
                        f,
                        {
                            "url": url,
                            "clean_title": clean_title,
                            "full_title": full_title,
                            "status": "ok",
                            "error": "",
                        },
                    )

                    print(f"  -> {clean_title}")

                except Exception as e:
                    save_row(
                        writer,
                        f,
                        {
                            "url": url,
                            "clean_title": "",
                            "full_title": "",
                            "status": "error",
                            "error": str(e),
                        },
                    )

                    print(f"  ERROR: {e}")

        browser.close()

    print(f"\nSaved results to: {output_path}")


if __name__ == "__main__":
    main()