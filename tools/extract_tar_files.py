from pathlib import Path
import time
import random

from playwright.sync_api import (
    Playwright,
    sync_playwright,
    TimeoutError as PlaywrightTimeoutError,
)


INPUT_FILE = Path("observable_links.txt")
OUTPUT_DIR = Path("observable_downloads")

MIN_DELAY_SECONDS = 1
MAX_DELAY_SECONDS = 3


def safe_filename(name: str) -> str:
    bad_chars = '<>:"/\\|?*'

    for ch in bad_chars:
        name = name.replace(ch, "_")

    return name


def read_links() -> list[str]:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Cannot find {INPUT_FILE.resolve()}")

    links = []

    for line in INPUT_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()

        if not line:
            continue

        if line.startswith("#"):
            continue

        links.append(line)

    return links


def polite_delay() -> None:
    delay = random.uniform(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS)
    print(f"Waiting {delay:.1f} seconds before next download...")
    time.sleep(delay)


def download_observable_code(page, url: str, index: int) -> None:
    print()
    print(f"[{index}] Opening: {url}")

    page.goto(url, wait_until="networkidle", timeout=60000)

    page.get_by_role("button", name="Notebook actions").click(timeout=30000)

    page.get_by_role("menuitem", name="Export").click(timeout=30000)

    with page.expect_download(timeout=60000) as download_info:
        page.get_by_role("menuitem", name="Download code").click(timeout=30000)

    download = download_info.value

    filename = safe_filename(download.suggested_filename)

    save_path = OUTPUT_DIR / f"{index:03d}_{filename}"

    download.save_as(save_path)

    print(f"[{index}] Saved: {save_path.resolve()}")


def run(playwright: Playwright) -> None:
    links = read_links()

    if not links:
        print("No links found in observable_links.txt")
        return

    OUTPUT_DIR.mkdir(exist_ok=True)

    browser = playwright.chromium.launch(
        headless=True,
        slow_mo=300,
    )

    context = browser.new_context(
        accept_downloads=True,
    )

    page = context.new_page()

    try:
        for index, url in enumerate(links, start=1):
            try:
                download_observable_code(page, url, index)

            except PlaywrightTimeoutError:
                print(f"[{index}] Timeout failed: {url}")

            except Exception as e:
                print(f"[{index}] Failed: {url}")
                print(f"Reason: {e}")

            if index < len(links):
                polite_delay()

    finally:
        context.close()
        browser.close()


if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)