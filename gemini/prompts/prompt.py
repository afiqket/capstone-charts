import csv
import hashlib
import json
import subprocess
import uuid
import argparse
from datetime import datetime, timezone
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument(
    "--questions",
    default="questions/c1_jscsv_questions.csv",
    help="Path to the questions CSV file"
)
args = parser.parse_args()

QUESTIONS_CSV = Path(args.questions)
RUNS_DIR = Path("runs/gemini/c1")
RUNS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_NAME = "gemini-3.1-pro-preview"
CONDITION = "C1"
INPUT_MODALITY = "JS+CSV"

def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def run_gemini(prompt: str):
    command = [
        "gemini.cmd",
        "--model", MODEL_NAME,
        "-p", prompt
    ]

    print("PROMPT SENT:")
    print(prompt)
    print("-" * 50)
    
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        shell=False
    )

    return {
        "returncode": result.returncode,
        "stdout": result.stdout.strip(),
        "stderr": result.stderr.strip(),
        "command": command
    }

with QUESTIONS_CSV.open("r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)

    for row in reader:
        run_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        chart_id = row["chart_id"]
        question_id = row["question_id"]
        js_path = row["js_path"]
        csv_path = row["csv_path"]
        question = row["question"]

        # C1 prompt: only JS file + CSV file + plain question.
        # No role, no examples, no formatting instruction, no step-by-step instruction.
        prompt = f"@{js_path} @{csv_path} Question: {question}"

        print(f"Running {CONDITION} | {INPUT_MODALITY} | chart={chart_id} | question={question_id}")

        result = run_gemini(prompt)

        record = {
            "run_id": run_id,
            "vendor": "Google",
            "tool": "Gemini CLI",
            "model_name": MODEL_NAME,
            "condition": CONDITION,
            "input_modality": INPUT_MODALITY,
            "chart_id": chart_id,
            "question_id": question_id,
            "js_path": js_path,
            "csv_path": csv_path,
            "question": question,
            "prompt": prompt,
            "prompt_hash": hash_text(prompt),
            "returncode": result["returncode"],
            "raw_response": result["stdout"],
            "stderr": result["stderr"],
            "parsed_answer": "",
        }

        out_path = RUNS_DIR / f"{chart_id}_{question_id}_{INPUT_MODALITY}_{run_id}.json"

        with out_path.open("w", encoding="utf-8") as out:
            json.dump(record, out, ensure_ascii=False, indent=2)

        print(f"Saved: {out_path}")

