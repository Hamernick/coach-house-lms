"""Resume offline filing enrichment from a retained IRS archive into the private ledger.

Each bounded extraction and ingestion has a saved receipt. No network or public writes.
"""
import argparse
import fcntl
import importlib.util
import json
import os
from pathlib import Path
import signal
import shutil
import subprocess
import time

SERVER = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("irs_archive", SERVER / "extract-irs-archive.py")
archive_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(archive_module)


def save(path, value):
    """Publish complete private JSON atomically without replacing immutable receipts."""
    temporary = path.with_name(path.name + f".{os.getpid()}.tmp")
    with temporary.open("w") as stream:
        json.dump(value, stream, indent=2)
        stream.flush()
        os.fsync(stream.fileno())
    os.link(temporary, path)
    temporary.unlink()


def run(args):
    if not (args.state / "research.sqlite").is_file():
        raise ValueError("Existing research ledger required; never initialize on resume")
    args.output.mkdir(parents=True, exist_ok=True, mode=0o700)
    lock = (args.output / "operator.lock").open("a")
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    stopped = False

    def stop(*_):
        nonlocal stopped
        stopped = True

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    started = time.monotonic()
    context = archive_module.prepare(args.index, args.archive, args.state,
                                     index_batch=args.index_batch, allow_missing=args.allow_missing_members)
    try:
        binding = {**context["binding"], "state": str(args.state.resolve()), "limit": args.limit}
        session = args.output / "session.json"
        if session.exists():
            if json.loads(session.read_text()) != binding:
                raise ValueError("Archive/index/population/limit changed; preserve run and choose new output")
        else:
            save(session, binding)
        print(json.dumps({"phase": "prepared", "available": len(context["selected"]),
                          "missing": len(context["missing"]), "seconds": time.monotonic() - started}), flush=True)
        after, number, processed, quarantined = "", 1, 0, 0
        while not stopped:
            batch = args.output / f"batch-{number:05d}"
            batch.mkdir(exist_ok=True, mode=0o700)
            manifest, done = batch / "extraction.json", batch / "completed.json"
            if manifest.exists():
                report = json.loads(manifest.read_text())
                if any(report[key] != value for key, value in context["binding"].items()) or report["after"] != after:
                    raise ValueError("Saved extraction binding/cursor mismatch")
            else:
                if shutil.disk_usage(args.output).free < 2_000_000_000:
                    raise ValueError("Less than 2 GB free; extraction stopped before next batch")
                report = archive_module.extract_prepared(context, batch / "xml", args.limit, after=after)
                save(manifest, report)
            if done.exists():
                if json.loads(done.read_text())["extraction_sha256"] != archive_module.digest(manifest):
                    raise ValueError("Completed extraction manifest changed")
            else:
                # A crash after a ledger commit but before this receipt is safe:
                # the existing importer skips committed content hashes on replay.
                command = [args.node, str(SERVER / "cli.mjs"), "ingest-filings", "--state", str(args.state),
                           "--input", str(batch / "xml"), "--limit", str(args.limit), "--write"]
                result = subprocess.run(command, capture_output=True, text=True, timeout=900)
                if result.returncode:
                    raise RuntimeError(f"Filing ingestion failed: {result.stderr[-2000:]}")
                counts = json.loads(result.stdout)
                if sum(counts[key] for key in ("matched", "unmatched", "errors", "replayed")) != report["extracted"]:
                    raise ValueError("Ingestion population does not match extracted batch")
                save(done, {"extraction_sha256": archive_module.digest(manifest), "counts": counts,
                            "completed_at": time.time(), "last_member": report["last_member"]})
                processed += 1
                print(json.dumps({"phase": "ingested", "batch": number, "counts": counts,
                                  "remaining": report["deferred_by_limit"]}), flush=True)
            quarantined += len(report.get("quarantined", []))
            after = report["last_member"]
            if not report["deferred_by_limit"]:
                final = args.output / "complete.json"
                if not final.exists():
                    save(final, {"batches": number, "available": len(context["selected"]),
                                 "last_member": after, "binding": binding, "quarantined": quarantined,
                                 "status": "processed_with_quarantine" if quarantined else "processed"})
                return
            if not args.all and processed >= args.max_batches:
                return
            number += 1
    finally:
        context["zipped"].close()
        lock.close()


if __name__ == "__main__":
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("index", "archive", "state", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    parser.add_argument("--node", required=True, help="Existing Node >=22.13 executable")
    parser.add_argument("--limit", type=int, default=1000, choices=range(1, 1001), metavar="1..1000")
    parser.add_argument("--max-batches", type=int, default=1)
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--index-batch")
    parser.add_argument("--allow-missing-members", action="store_true")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    if args.max_batches < 1:
        parser.error("--max-batches must be positive")
    if args.write:
        run(args)
    else:
        print(json.dumps({"dryRun": True, "networkRequests": 0, "publicWrites": 0,
                          "next": "Add --write to extract and ingest retained filings into the existing private ledger"}))
