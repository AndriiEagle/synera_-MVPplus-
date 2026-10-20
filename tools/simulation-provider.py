"""Synera's finite image-job adapter. Token Monster alone dispatches and accounts."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT_RUN = "synera-android-20261020"
ARCHITECTURE_RUN = "synera-android-architecture-20261020"
MODEL = "z-ai/glm-5.3-flash"


def spend_state(rows, lifecycle, recovered, caps):
    spent = {model: 0.0 for model in caps}
    for dispatch_id, row in lifecycle.dispatch_states(rows).items():
        run = str(row.get("run") or "")
        if run != ARCHITECTURE_RUN and not run.startswith(ROOT_RUN + "-"):
            continue
        cost = recovered.get(dispatch_id, lifecycle.known_cost(row.get("cost")))
        if not lifecycle.terminal_event(row) or cost is None:
            raise ValueError("HOLD: unresolved canonical receipt " + dispatch_id)
        model = row.get("requested_model") or row.get("model")
        if model not in spent:
            raise ValueError("HOLD: unexpected model in root task")
        spent[model] += cost
    if any(spent[m] > caps[m] for m in caps) or spent[MODEL] >= caps[MODEL] or sum(spent.values()) >= 6:
        raise ValueError("HOLD: approved task budget exhausted")
    return spent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tm", required=True)
    parser.add_argument("--authority", required=True)
    parser.add_argument("--request")
    args = parser.parse_args()
    tm = Path(args.tm).resolve()
    sys.path.insert(0, str(tm))
    import swarm
    import dispatch_lifecycle as lifecycle

    authority = json.loads(Path(args.authority).read_text(encoding="utf-8-sig"))
    caps = authority["modelCapsUsd"]
    if authority.get("objective") != "synera-android-simulation-20261020" or authority.get("totalCapUsd") != 6 or caps != {
        MODEL: 4, "z-ai/glm-5.3": 1, "google/gemini-4-argon": 1
    }:
        raise ValueError("HOLD: explicit root approval does not match this stage")
    rows = lifecycle.read_rows(swarm.LEDGER)
    recovered = swarm._reconciled_dispatch_costs(rows, lifecycle.dispatch_states(rows))
    spent = spend_state(rows, lifecycle, recovered, caps)
    gate = swarm.receipt_recovery_status(run_label=ARCHITECTURE_RUN)
    if gate["paid_receipt_gate"] != "RECEIPTS_RESOLVED":
        raise ValueError("HOLD: canonical paid receipt gate")
    if not args.request:
        print(json.dumps({"enabled": True, "spent": spent, "remaining": 6 - sum(spent.values())}))
        return
    request_path = Path(args.request).resolve()
    request = json.loads(request_path.read_text(encoding="utf-8"))
    image = Path(request["screenshot"]).resolve()
    if image.parent != request_path.parent or image.suffix != ".png":
        raise ValueError("Screenshot must be a PNG in this decision directory")
    image_hash = hashlib.sha256(image.read_bytes()).hexdigest()
    if image_hash != request["screenshotSha256"]:
        raise ValueError("Screenshot hash mismatch")
    job_id = ROOT_RUN + "-" + request_path.parent.name
    if not all(c.isalnum() or c == "-" for c in job_id):
        raise ValueError("Invalid decision identifier")
    prompt = request["prompt"]
    if not isinstance(prompt, str) or not prompt or len(prompt) > 20000:
        raise ValueError("Invalid finite prompt")
    job = {"id": job_id, "task_id": job_id, "role": "worker", "model": MODEL, "effort": "low",
           "task_scope": "narrow", "retries": 1, "max_tokens": 8000, "hard_max_tokens": 12000,
           "prompt": prompt, "images": [str(image)], "image_input_tokens_high": 32768,
           "files": [], "out": str(request_path.parent / "decision.txt")}
    plan = request_path.parent / "plan.json"
    summary = request_path.parent / "summary.json"
    # A decision ID is single-use. A previous attempt must be collected/reconciled, never regenerated.
    if plan.exists():
        raise ValueError("HOLD: decision was already prepared; collect its canonical result")
    plan.write_text(json.dumps([job], ensure_ascii=False), encoding="utf-8")
    budget = min(0.02, caps[MODEL] - spent[MODEL], 6 - sum(spent.values()))
    command = [sys.executable, "-B", str(tm / "swarm.py"), "--plan", str(plan),
               "--root", str(request_path.parent), "--run-label", job_id, "--budget", str(budget),
               "--concurrency", "1", "--stop-on-error", "--summary-out", str(summary)]
    run = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace")
    (request_path.parent / "dispatch.log").write_text(run.stdout + run.stderr, encoding="utf-8")
    if run.returncode:
        raise ValueError("HOLD: canonical dispatch refused or failed; inspect decision dispatch.log")
    collect = subprocess.run(command + ["--collect-only"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    (request_path.parent / "collection.log").write_text(collect.stdout + collect.stderr, encoding="utf-8")
    if collect.returncode:
        raise ValueError("HOLD: receipt/output collection failed")
    rows = lifecycle.read_rows(swarm.LEDGER)
    terminal = [r for r in rows if r.get("event") == "dispatch_terminal" and r.get("task_id") == job_id and r.get("ok") is True]
    if len(terminal) != 1:
        raise ValueError("HOLD: unique canonical terminal receipt missing")
    receipt = terminal[0]
    output = (request_path.parent / "decision.txt").read_bytes()
    if (receipt.get("actual_model") != MODEL or not receipt.get("route_identity_verified")
            or receipt.get("truncated") or lifecycle.known_cost(receipt.get("cost")) is None
            or hashlib.sha256(output).hexdigest() != receipt.get("artifact_sha256")):
        raise ValueError("HOLD: identity, receipt or output binding failed")
    text = output.decode("utf-8").strip().removeprefix("\ufeff")
    # Local formatting repair only; schema and semantic checks still run in the executor.
    if text.startswith("```json\n") and text.endswith("\n```"):
        text = text[8:-4]
    elif text.startswith("```\n") and text.endswith("\n```"):
        text = text[4:-4]
    decision = json.loads(text)
    public_receipt = {key: receipt.get(key) for key in (
        "generation_id", "task_id", "actual_model", "cost", "cost_evidence_type", "artifact_sha256",
        "output_request_sha256", "route_identity_verified", "truncated", "dispatch_id")}
    public_receipt.update(input_modalities=["text", "image"], screenshotSha256=image_hash)
    print(json.dumps({"decision": decision, "receipt": public_receipt}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"enabled": False, "message": str(error)}, ensure_ascii=False))
        raise SystemExit(1)
