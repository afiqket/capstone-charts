#!/usr/bin/env python3
from __future__ import annotations

import csv
import re
import shutil
import tarfile
import tempfile
from pathlib import Path

EXCLUDED_JS_NAMES = {"index.js", "runtime.js"}


def slugify_title(title: str) -> str:
    name = title.strip().lower()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[-\s]+", "_", name)
    name = re.sub(r"_+", "_", name).strip("_")
    return name or "chart"


def unpack_tgz(tgz_path: Path) -> Path:
    if not tgz_path.exists():
        raise FileNotFoundError(f"Archive not found: {tgz_path}")

    temp_dir = Path(tempfile.mkdtemp(prefix="chart_unpack_", dir=tgz_path.parent))

    with tarfile.open(tgz_path, "r:gz") as tar:
        tar.extractall(path=temp_dir)

    return temp_dir


def get_title_from_readme(folder: Path) -> tuple[str, Path]:
    readme_candidates = sorted(folder.rglob("README.md"))

    if not readme_candidates:
        raise FileNotFoundError(f"README.md not found anywhere inside: {folder}")

    readme_path = readme_candidates[0]

    with readme_path.open("r", encoding="utf-8") as f:
        first_line = f.readline().strip()

    if not first_line:
        raise ValueError(f"README.md first line is empty: {readme_path}")

    title = re.sub(r"^#+\s*", "", first_line).strip()
    if not title:
        raise ValueError(f"Could not extract title from: {readme_path}")

    return title, readme_path.parent


def find_target_js_file(folder: Path) -> Path:
    candidates = []

    for js_file in folder.rglob("*.js"):
        if js_file.name in EXCLUDED_JS_NAMES:
            continue
        candidates.append(js_file)

    if not candidates:
        raise FileNotFoundError(
            f"No JS file found in {folder} excluding {sorted(EXCLUDED_JS_NAMES)}"
        )

    candidates.sort(key=lambda p: (len(p.relative_to(folder).parts), str(p)))
    return candidates[0]


def append_to_csv(csv_path: Path, title: str, filename: str) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)

    existing_rows = set()
    if csv_path.exists():
        with csv_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 2:
                    existing_rows.add((row[0], row[1]))

    if (title, filename) in existing_rows:
        return

    with csv_path.open("a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([title, filename])


def move_js_file(js_file: Path, destination: Path) -> bool:
    destination.parent.mkdir(parents=True, exist_ok=True)

    if destination.exists():
        print(f"Skipped JS move, already exists: {destination.name}")
        return False

    shutil.move(str(js_file), str(destination))
    return True


def move_files_directory(source_folder: Path, charts_dir: Path) -> None:
    source_files_dir = source_folder / "files"
    if not source_files_dir.exists():
        return

    destination_files_dir = charts_dir / "files"
    destination_files_dir.mkdir(parents=True, exist_ok=True)

    for item in source_files_dir.iterdir():
        target = destination_files_dir / item.name
        if target.exists():
            print(f"Skipped asset, already exists: {target.name}")
            continue
        shutil.move(str(item), str(target))

    try:
        source_files_dir.rmdir()
    except OSError:
        pass


def delete_folder(folder: Path) -> None:
    if folder.exists() and folder.is_dir():
        shutil.rmtree(folder)


def prepare_chart_from_archive(archive_path: Path, charts_csv: Path, charts_dir: Path) -> None:
    source_folder = unpack_tgz(archive_path)

    try:
        title, actual_root = get_title_from_readme(source_folder)
        safe_name = slugify_title(title)
        new_js_name = f"{safe_name}.js"

        js_file = find_target_js_file(actual_root)

        charts_dir.mkdir(parents=True, exist_ok=True)
        destination_js = charts_dir / new_js_name

        moved = move_js_file(js_file, destination_js)

        if moved:
            append_to_csv(charts_csv, title, new_js_name)

        move_files_directory(actual_root, charts_dir)

        if moved:
            print(f"Done: {archive_path.name} -> {new_js_name}")
        else:
            print(f"Skipped chart, already exists: {new_js_name}")

    except Exception as e:
        print(f"Skipped {archive_path.name}: {e}")

    finally:
        delete_folder(source_folder)


def resolve_archives() -> list[Path]:
    cwd = Path.cwd()
    archives = sorted(cwd.glob("*.tgz")) + sorted(cwd.glob("*.tar.gz"))
    return archives


def main() -> None:
    charts_csv = Path("charts.csv").resolve()
    charts_dir = Path("charts").resolve()

    archives = resolve_archives()

    if not archives:
        print("No .tgz or .tar.gz files found.")
        return

    print(f"Found {len(archives)} archive(s).")

    for archive in archives:
        print(f"Processing: {archive.name}")
        prepare_chart_from_archive(archive, charts_csv, charts_dir)

    print("Finished.")


if __name__ == "__main__":
    main()