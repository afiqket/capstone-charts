# run.py
from __future__ import annotations

import csv
import json
import re
import shutil
import subprocess
import traceback
from collections import OrderedDict
from datetime import datetime
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

QNA_CSV = BASE_DIR / "qna.csv"
CHARTS_DIR = BASE_DIR / "charts"
RUNS_DIR = BASE_DIR / "codex_runs"

CODEX_CMD = r"C:\Users\Lenovo\AppData\Roaming\npm\codex.cmd"

PROMPT_NAME = "prompt.txt"
ANSWER_NAME = "answer.txt"
ERRORS_NAME = "errors.txt"

QNA_COLUMNS = [
    "chart_id",
    "url",
    "title",
    "question_id",
    "question",
    "safe title",
    "javascript file",
    "data files",
    "enabled",
]

RESULT_COLUMNS = QNA_COLUMNS + [
    "run_dir",
    "status",
    "answer",
    "error",
]


def is_enabled(value: str) -> bool:
    return str(value).strip() == "1"


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[-\s]+", "_", value)
    value = re.sub(r"_+", "_", value).strip("_")
    return value or "chart"


def run_dir_name(chart_id: str) -> str:
    chart_id = chart_id.strip()

    try:
        return f"run_{int(chart_id):03d}"
    except ValueError:
        return f"run_{slugify(chart_id)}"


def timestamp_string() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def reset_run_directory(run_dir: Path) -> None:
    if run_dir.exists():
        shutil.rmtree(run_dir)

    run_dir.mkdir(parents=True, exist_ok=True)


def append_error(context: str, message: str) -> None:
    RUNS_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().isoformat(timespec="seconds")
    text = f"\n[{timestamp}] {context}\n{message}\n"

    print(text)

    errors_path = RUNS_DIR / ERRORS_NAME
    with errors_path.open("a", encoding="utf-8", errors="replace") as f:
        f.write(text)


def log_exception(context: str, exc: Exception) -> None:
    append_error(context, traceback.format_exc())


def safe_relative_path(value: str, label: str) -> Path:
    value = value.strip().replace("\\", "/")

    if not value:
        raise ValueError(f"Empty {label}")

    path = Path(value)

    if path.is_absolute():
        raise ValueError(f"{label} must be relative, not absolute: {value}")

    if ".." in path.parts:
        raise ValueError(f"{label} must not contain '..': {value}")

    return path


def split_data_files(value: str) -> list[str]:
    value = str(value or "").strip()

    if not value:
        return []

    parts = re.split(r"[\n;,|]+", value)

    cleaned: list[str] = []
    seen: set[str] = set()

    for part in parts:
        item = part.strip()

        if not item:
            continue

        if item not in seen:
            cleaned.append(item)
            seen.add(item)

    return cleaned


def unique_nonempty(values: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()

    for value in values:
        value = str(value or "").strip()

        if not value:
            continue

        if value not in seen:
            result.append(value)
            seen.add(value)

    return result


def read_qna_rows() -> list[dict[str, str]]:
    if not QNA_CSV.exists():
        raise FileNotFoundError(f"QNA CSV not found: {QNA_CSV}")

    with QNA_CSV.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        missing_columns = set(QNA_COLUMNS) - set(reader.fieldnames or [])

        if missing_columns:
            raise ValueError(f"Missing columns in qna.csv: {sorted(missing_columns)}")

        return list(reader)


def group_enabled_rows_by_chart(rows: list[dict[str, str]]) -> OrderedDict[str, list[dict[str, str]]]:
    groups: OrderedDict[str, list[dict[str, str]]] = OrderedDict()

    for row in rows:
        if not is_enabled(row.get("enabled", "")):
            continue

        chart_id = row["chart_id"].strip()

        if not chart_id:
            raise ValueError(f"Found enabled row with empty chart_id: {row}")

        if chart_id not in groups:
            groups[chart_id] = []

        groups[chart_id].append(row)

    return groups


def get_chart_metadata(chart_rows: list[dict[str, str]]) -> tuple[str, str, list[str]]:
    safe_titles = unique_nonempty([row.get("safe title", "") for row in chart_rows])
    javascript_files = unique_nonempty([row.get("javascript file", "") for row in chart_rows])

    data_files: list[str] = []
    seen_data_files: set[str] = set()

    for row in chart_rows:
        for data_file in split_data_files(row.get("data files", "")):
            if data_file not in seen_data_files:
                data_files.append(data_file)
                seen_data_files.add(data_file)

    if not safe_titles:
        raise ValueError("Missing safe title")

    if not javascript_files:
        raise ValueError("Missing javascript file")

    if len(safe_titles) > 1:
        raise ValueError(f"Same chart_id has multiple safe titles: {safe_titles}")

    if len(javascript_files) > 1:
        raise ValueError(f"Same chart_id has multiple JavaScript files: {javascript_files}")

    return safe_titles[0], javascript_files[0], data_files


def copy_file(source_path: Path, destination_path: Path) -> None:
    if not source_path.exists():
        raise FileNotFoundError(f"File not found: {source_path}")

    if not source_path.is_file():
        raise FileNotFoundError(f"Not a file: {source_path}")

    destination_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, destination_path)


def copy_chart_files(chart_rows: list[dict[str, str]], run_dir: Path) -> list[str]:
    safe_title, javascript_file, data_files = get_chart_metadata(chart_rows)

    source_dir = CHARTS_DIR / safe_title

    if not source_dir.exists():
        raise FileNotFoundError(f"Chart folder not found: {source_dir}")

    copied_relative_paths: list[str] = []

    js_relative_path = safe_relative_path(javascript_file, "javascript file")
    js_source_path = source_dir / js_relative_path
    js_destination_path = run_dir / js_relative_path

    copy_file(js_source_path, js_destination_path)
    copied_relative_paths.append(js_relative_path.as_posix())

    for data_file in data_files:
        data_relative_path = safe_relative_path(data_file, "data file")

        if data_relative_path.parts and data_relative_path.parts[0].lower() == "files":
            source_path = source_dir / data_relative_path
            destination_relative_path = data_relative_path
        else:
            source_path = source_dir / "files" / data_relative_path
            destination_relative_path = Path("files") / data_relative_path

        destination_path = run_dir / destination_relative_path

        copy_file(source_path, destination_path)
        copied_relative_paths.append(destination_relative_path.as_posix())

    return copied_relative_paths


def build_prompt(chart_rows: list[dict[str, str]], copied_files: list[str]) -> str:
    file_list = "\n".join(f"- {name}" for name in copied_files)

    question_lines: list[str] = []

    for row in chart_rows:
        question_id = row["question_id"].strip()
        question = row["question"].strip()

        question_lines.append(
            f"- question_id: {question_id}\n"
            f"  question: {question}"
        )

    questions_text = "\n".join(question_lines)

    return f"""
You are answering multiple chart questions for the same chart.

Read these local files:
{file_list}

Use the JavaScript file and any provided data files to answer the questions.
Some charts may not have separate data files.

Questions:
{questions_text}

Return ONLY valid JSON.
Use this exact format:

{{
  "question_id_here": "answer here"
}}

Rules:
- Use the exact question_id values as JSON keys.
- WHEN ANSWERING A QUESTION, DO NOT REFER TO ANY OTHER QUESTIONS OR ANSWERS. 
""".strip()


def write_prompt_file(run_dir: Path, prompt: str) -> Path:
    prompt_path = run_dir / PROMPT_NAME
    prompt_path.write_text(prompt, encoding="utf-8", errors="replace")
    return prompt_path


def run_codex(run_dir: Path) -> str:
    answer_path = run_dir / ANSWER_NAME

    short_prompt = f"Read {PROMPT_NAME} and answer."

    cmd = [
        CODEX_CMD,
        "exec",
        "--cd",
        str(run_dir),
        "--ephemeral",
        "--skip-git-repo-check",
        "--output-last-message",
        str(answer_path),
        short_prompt,
    ]

    result = subprocess.run(
        cmd,
        cwd=run_dir,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    (run_dir / "stdout.txt").write_text(result.stdout, encoding="utf-8", errors="replace")
    (run_dir / "stderr.txt").write_text(result.stderr, encoding="utf-8", errors="replace")

    if result.returncode != 0:
        raise RuntimeError(
            f"Codex failed with exit code {result.returncode}. "
            f"See {run_dir / 'stderr.txt'}"
        )

    if answer_path.exists():
        return answer_path.read_text(encoding="utf-8", errors="replace").strip()

    return result.stdout.strip()


def strip_json_code_fence(text: str) -> str:
    text = text.strip()

    fence_match = re.search(r"```(?:json)?\s*(.*?)```", text, flags=re.DOTALL | re.IGNORECASE)

    if fence_match:
        return fence_match.group(1).strip()

    return text


def extract_json_object(text: str) -> str:
    text = strip_json_code_fence(text)

    first = text.find("{")
    last = text.rfind("}")

    if first == -1 or last == -1 or last <= first:
        raise ValueError("Could not find JSON object in Codex answer")

    return text[first:last + 1]


def parse_codex_answers(answer_text: str) -> dict[str, str]:
    json_text = extract_json_object(answer_text)
    parsed = json.loads(json_text)

    if isinstance(parsed, dict) and "answers" in parsed:
        parsed = parsed["answers"]

    answers: dict[str, str] = {}

    if isinstance(parsed, dict):
        for key, value in parsed.items():
            question_id = str(key).strip()

            if isinstance(value, dict) and "answer" in value:
                answer = str(value["answer"]).strip()
            else:
                answer = str(value).strip()

            answers[question_id] = answer

        return answers

    if isinstance(parsed, list):
        for item in parsed:
            if not isinstance(item, dict):
                continue

            question_id = str(item.get("question_id", "")).strip()
            answer = str(item.get("answer", "")).strip()

            if question_id:
                answers[question_id] = answer

        return answers

    raise ValueError("Parsed JSON was not a dictionary or list")


def make_result_row(
    qna_row: dict[str, str],
    run_dir: Path,
    status: str,
    answer: str,
    error: str,
) -> dict[str, str]:
    result_row = {column: qna_row.get(column, "") for column in QNA_COLUMNS}

    result_row.update(
        {
            "run_dir": str(run_dir),
            "status": status,
            "answer": answer,
            "error": error,
        }
    )

    return result_row


def make_error_rows(
    chart_rows: list[dict[str, str]],
    run_dir: Path,
    status: str,
    error: str,
) -> list[dict[str, str]]:
    return [
        make_result_row(
            qna_row=row,
            run_dir=run_dir,
            status=status,
            answer="",
            error=error,
        )
        for row in chart_rows
    ]


def append_result_rows(results_path: Path, rows: list[dict[str, str]]) -> None:
    results_path.parent.mkdir(parents=True, exist_ok=True)

    file_exists = results_path.exists() and results_path.stat().st_size > 0

    mode = "a" if file_exists else "w"
    encoding = "utf-8" if file_exists else "utf-8-sig"

    with results_path.open(mode, encoding=encoding, newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=RESULT_COLUMNS,
            extrasaction="ignore",
        )

        if not file_exists:
            writer.writeheader()

        writer.writerows(rows)


def run_one_chart(chart_id: str, chart_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    run_dir = RUNS_DIR / run_dir_name(chart_id)

    first_row = chart_rows[0]
    safe_title = first_row.get("safe title", "").strip()
    title = first_row.get("title", "").strip()

    print(f"\n=== Running chart_id={chart_id} ===")
    print(f"Title: {title}")
    print(f"Safe title: {safe_title}")
    print(f"Questions: {len(chart_rows)}")
    print(f"Run dir: {run_dir}")

    try:
        reset_run_directory(run_dir)

        copied_files = copy_chart_files(chart_rows, run_dir)

        prompt = build_prompt(chart_rows, copied_files)
        write_prompt_file(run_dir, prompt)

        raw_answer = run_codex(run_dir)

        try:
            parsed_answers = parse_codex_answers(raw_answer)
        except Exception as parse_error:
            log_exception(f"chart_id={chart_id} parse error", parse_error)

            return make_error_rows(
                chart_rows=chart_rows,
                run_dir=run_dir,
                status="parse_error",
                error=f"Could not parse {ANSWER_NAME}. See {run_dir / ANSWER_NAME}",
            )

        result_rows: list[dict[str, str]] = []

        for row in chart_rows:
            question_id = row["question_id"].strip()
            answer = parsed_answers.get(question_id, "")

            if answer:
                result_rows.append(
                    make_result_row(
                        qna_row=row,
                        run_dir=run_dir,
                        status="ok",
                        answer=answer,
                        error="",
                    )
                )
            else:
                error = f"No parsed answer for question_id={question_id}. See {run_dir / ANSWER_NAME}"
                append_error(f"chart_id={chart_id} missing answer", error)

                result_rows.append(
                    make_result_row(
                        qna_row=row,
                        run_dir=run_dir,
                        status="missing_answer",
                        answer="",
                        error=error,
                    )
                )

        print("Status: ok")

        return result_rows

    except Exception as e:
        log_exception(f"chart_id={chart_id} run error", e)

        return make_error_rows(
            chart_rows=chart_rows,
            run_dir=run_dir,
            status="error",
            error=str(e),
        )


def main() -> None:
    RUNS_DIR.mkdir(parents=True, exist_ok=True)

    results_path = RUNS_DIR / f"results_{timestamp_string()}.csv"

    try:
        rows = read_qna_rows()
    except Exception as e:
        log_exception("startup error", e)
        raise

    groups = group_enabled_rows_by_chart(rows)

    print(f"Loaded rows: {len(rows)}")
    print(f"Enabled charts: {len(groups)}")
    print(f"Results file: {results_path}")
    print(f"Errors file: {RUNS_DIR / ERRORS_NAME}")

    for chart_id, chart_rows in groups.items():
        result_rows = run_one_chart(chart_id, chart_rows)
        append_result_rows(results_path, result_rows)

    print(f"\nSaved results to: {results_path}")


if __name__ == "__main__":
    main()