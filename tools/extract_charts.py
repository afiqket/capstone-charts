#!/usr/bin/env python3
from __future__ import annotations

import csv
import re
import shutil
import tarfile
import tempfile
from pathlib import Path

EXCLUDED_JS_NAMES = {"index.js", "runtime.js"}
DATA_FILE_EXTENSIONS = {".csv", ".xlsx", ".xls", ".xlsm", ".xlsb", ".json"}

DOWNLOADS_DIR = Path("observable_downloads")
NEW_CHARTS_CSV = Path("new_charts.csv")
NEW_CHARTS_DIR = Path("new_charts")


def slugify_title(title: str):
    name = title.strip().lower()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[-\s]+", "_", name)
    name = re.sub(r"_+", "_", name).strip("_")
    return name or "chart"


def unpack_tgz(tgz_path: Path):
    if not tgz_path.exists():
        raise FileNotFoundError(f"Archive not found: {tgz_path}")

    temp_dir = Path(tempfile.mkdtemp(prefix="chart_unpack_", dir=tgz_path.parent))

    with tarfile.open(tgz_path, "r:gz") as tar:
        tar.extractall(path=temp_dir)

    return temp_dir


def get_title_from_readme(folder: Path):
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


def find_target_js_file(folder: Path):
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


def find_data_files(folder: Path):
    candidates = []

    for file_path in folder.rglob("*"):
        if not file_path.is_file():
            continue
        
        if file_path.name == "package.json":
            continue

        if file_path.suffix.lower() in DATA_FILE_EXTENSIONS:
            candidates.append(file_path)

    candidates.sort(key=lambda p: (len(p.relative_to(folder).parts), str(p)))

    return candidates


def append_to_new_charts_csv(
    csv_path: Path,
    original_archive: str,
    title: str,
    safe_title: str,
    javascript_file: str,
    data_files: str,
):
    csv_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "original archive",
        "title",
        "safe title",
        "javascript file",
        "data files",
    ]

    rows = []

    if csv_path.exists():
        with csv_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)

            if reader.fieldnames:
                for row in reader:
                    cleaned_row = {
                        "original archive": row.get(
                            "original archive",
                            row.get("original file", ""),
                        ),
                        "title": row.get("title", ""),
                        "safe title": row.get("safe title", ""),
                        "javascript file": row.get(
                            "javascript file",
                            row.get("js file", ""),
                        ),
                        "data files": row.get(
                            "data files",
                            row.get("csv file", ""),
                        ),
                    }

                    rows.append(cleaned_row)

    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow(row)

        writer.writerow(
            {
                "original archive": original_archive,
                "title": title,
                "safe title": safe_title,
                "javascript file": javascript_file,
                "data files": data_files,
            }
        )


def copy_file(source: Path, destination: Path):
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def copy_data_files(data_files, actual_root: Path, chart_output_dir: Path):
    copied_relative_paths = []

    for source_file in data_files:
        relative_path = source_file.relative_to(actual_root)
        destination_file = chart_output_dir / relative_path

        copy_file(source_file, destination_file)

        copied_relative_paths.append(relative_path.as_posix())

    return copied_relative_paths


def delete_folder(folder: Path):
    if folder.exists() and folder.is_dir():
        shutil.rmtree(folder)


def prepare_chart_from_archive(
    archive_path: Path,
    new_charts_csv: Path,
    new_charts_dir: Path,
):
    source_folder = unpack_tgz(archive_path)

    try:
        title, actual_root = get_title_from_readme(source_folder)
        safe_title = slugify_title(title)

        js_file = find_target_js_file(actual_root)
        data_files = find_data_files(actual_root)

        chart_output_dir = new_charts_dir / safe_title
        chart_output_dir.mkdir(parents=True, exist_ok=True)

        destination_js_name = f"{safe_title}.js"
        destination_js = chart_output_dir / destination_js_name

        copy_file(js_file, destination_js)

        copied_data_files = copy_data_files(
            data_files=data_files,
            actual_root=actual_root,
            chart_output_dir=chart_output_dir,
        )

        data_files_text = "; ".join(copied_data_files)

        append_to_new_charts_csv(
            new_charts_csv,
            original_archive=archive_path.name,
            title=title,
            safe_title=safe_title,
            javascript_file=destination_js_name,
            data_files=data_files_text,
        )

        print(f"Done: {archive_path.name}")
        print(f"  Original archive: {archive_path.name}")
        print(f"  Title: {title}")
        print(f"  Folder: {chart_output_dir}")
        print(f"  JavaScript file: {destination_js_name}")

        if data_files_text:
            print(f"  Data files: {data_files_text}")
        else:
            print("  Data files: None found")

        has_data_files = bool(data_files)
        return has_data_files

    except Exception as e:
        print(f"Skipped {archive_path.name}: {e}")
        return True

    finally:
        delete_folder(source_folder)


def resolve_archives():
    downloads_dir = DOWNLOADS_DIR.resolve()

    archives = (
        sorted(downloads_dir.glob("*.tgz"))
        + sorted(downloads_dir.glob("*.tar.gz"))
    )

    return archives


def main():
    new_charts_csv = NEW_CHARTS_CSV.resolve()
    new_charts_dir = NEW_CHARTS_DIR.resolve()

    archives = resolve_archives()

    if not archives:
        print(f"No .tgz or .tar.gz files found in {DOWNLOADS_DIR}.")
        return

    print(f"Found {len(archives)} archive(s).")

    archives_without_data_files = []

    for archive in archives:
        print(f"Processing: {archive.name}")

        has_data_files = prepare_chart_from_archive(
            archive,
            new_charts_csv,
            new_charts_dir,
        )

        if not has_data_files:
            archives_without_data_files.append(archive.name)

    print("Finished.")

    if archives_without_data_files:
        print()
        print("Archives with no CSV or Excel data files:")

        for archive_name in archives_without_data_files:
            print(f"  {archive_name}")
    else:
        print()
        print("All processed archives had at least one CSV or Excel data file.")


if __name__ == "__main__":
    main()