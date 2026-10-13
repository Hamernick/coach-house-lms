"""Bounded offline extraction of exact-EIN cohort members from an IRS ZIP/index.

Use with downloaded, immutable IRS index/ZIP snapshots. Never extractall().
"""
import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import shutil
import struct
import subprocess
import tempfile
import zlib
import zipfile
from datetime import datetime, timezone


def digest(path):
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def read_member(zipped, info):
    """Read one bounded member; Python cannot decode IRS Deflate64 (method 9)."""
    if info.flag_bits & (1 | 0x40):
        raise ValueError("Encrypted archive members are unsupported")
    if not 0 <= info.file_size <= 16_000_000:
        raise ValueError("Archive member exceeds uncompressed byte budget")
    if info.compress_type != 9:
        with zipped.open(info) as source:
            content = source.read(16_000_001)
    else:
        content = read_deflate64(zipped, info)
    if len(content) != info.file_size or zlib.crc32(content) != info.CRC:
        raise ValueError("Archive member size/CRC mismatch")
    return content


def read_deflate64(zipped, info):
    # Use the installed Info-ZIP decoder, never extract paths to disk. Some IRS
    # ZIP64 directory metadata is rejected by unzip despite valid member bytes.
    # Wrap only this indexed compressed member in a fresh, bounded ZIP envelope;
    # preserve/check its original size and CRC. Original snapshots stay intact.
    # Layout: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
    decoder = shutil.which("unzip")
    if not decoder or os.name != "posix":
        raise ValueError("Deflate64 requires POSIX unzip with USE_DEFLATE64 support")
    if not 0 <= info.compress_size <= 32_000_000:
        raise ValueError("Archive member exceeds compressed byte budget")
    with open(zipped.filename, "rb") as source:
        source.seek(info.header_offset)
        header = source.read(30)
        if len(header) != 30:
            raise ValueError("Truncated ZIP local header")
        fields = struct.unpack("<IHHHHHIIIHH", header)
        if fields[0] != 0x04034B50 or fields[3] != 9 or fields[2] != info.flag_bits:
            raise ValueError("ZIP local/central header mismatch")
        name = source.read(fields[-2]).decode("utf-8" if info.flag_bits & 0x800 else "cp437")
        if name != info.orig_filename:
            raise ValueError("ZIP local/central name mismatch")
        source.seek(fields[-1], 1)
        if source.tell() + info.compress_size > zipped.start_dir:
            raise ValueError("ZIP member overlaps central directory")
        compressed = source.read(info.compress_size)
    if len(compressed) != info.compress_size:
        raise ValueError("Truncated compressed member")
    name = b"member.xml"
    local = struct.pack("<IHHHHHIIIHH", 0x04034B50, 21, 0, 9, 0, 33,
                        info.CRC, len(compressed), info.file_size, len(name), 0) + name
    central = struct.pack("<IHHHHHHIIIHHHHHII", 0x02014B50, 21, 21, 0, 9, 0, 33,
                          info.CRC, len(compressed), info.file_size, len(name),
                          0, 0, 0, 0, 0, 0) + name
    end = struct.pack("<IHHHHIIH", 0x06054B50, 0, 0, 1, 1, len(central),
                      len(local) + len(compressed), 0)
    import resource

    def bound_output():
        resource.setrlimit(resource.RLIMIT_FSIZE, (16_000_001, 16_000_001))

    with tempfile.NamedTemporaryFile(suffix=".zip") as single, tempfile.TemporaryFile() as output, tempfile.TemporaryFile() as errors:
        single.write(local + compressed + central + end)
        single.flush()
        env = {k: v for k, v in os.environ.items() if k not in ("UNZIP", "UNZIPOPT", "ZIPINFO", "ZIPINFOOPT")}
        result = subprocess.run([decoder, "-p", single.name, "member.xml"],
                                stdin=subprocess.DEVNULL, stdout=output, stderr=errors,
                                timeout=15, env=env, preexec_fn=bound_output)
        if result.returncode:
            raise ValueError("Deflate64 decoder failed; source preserved for inspection")
        output.seek(0)
        return output.read(16_000_001)


def prepare(index, archive, state, *, index_batch=None, allow_missing=False):
    if archive.stat().st_size > 1_000_000_000:
        raise ValueError("Archive exceeds 1 GB")
    batch = archive.stem
    if not re.fullmatch(r"20\d{2}_TEOS_XML_\d{2}[A-Z]", batch):
        raise ValueError("Expected official IRS batch filename")
    index_batch = index_batch or batch
    if not re.fullmatch(r"20\d{2}_TEOS_XML_\d{2}[A-Z]", index_batch) or index_batch[:-1] != batch[:-1]:
        raise ValueError("Index batch override must stay within the same year/month")
    with sqlite3.connect(f"file:{state / 'research.sqlite'}?mode=ro", uri=True) as connection:
        eins = {r[0] for r in connection.execute("SELECT ein FROM organizations")}
    population_hash = hashlib.sha256("\n".join(sorted(eins)).encode()).hexdigest()
    wanted = {}
    with index.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            if row["XML_BATCH_ID"] == index_batch and row["EIN"].zfill(9) in eins:
                object_id = row["OBJECT_ID"]
                if not re.fullmatch(r"\d{18}", object_id):
                    raise ValueError("Unexpected IRS object identifier")
                name = f"{object_id}_public.xml"
                if name in wanted and wanted[name] != row:
                    raise ValueError("Conflicting index rows for object identifier")
                wanted[name] = row
    zipped = zipfile.ZipFile(archive)
    try:
        members = {}
        for info in zipped.infolist():
            name = Path(info.filename).name
            if name in wanted:
                if name in members:
                    raise ValueError("Ambiguous duplicate indexed archive member")
                members[name] = info
        missing = sorted(set(wanted) - set(members))
        if missing and not allow_missing:
            raise ValueError(f"{len(missing)} indexed members absent; inspect sibling archives before --allow-missing-members")
        return {"zipped": zipped, "members": members, "wanted": wanted,
                "selected": sorted(members), "missing": missing,
                "binding": {"archive_sha256": digest(archive), "index_sha256": digest(index),
                            "population_sha256": population_hash, "index_batch": index_batch,
                            "allow_missing": allow_missing},
                "stats": [(p, p.stat().st_size, p.stat().st_mtime_ns) for p in (index, archive)],
                "source_url": f"https://apps.irs.gov/pub/epostcard/990/xml/{batch[:4]}/{archive.name}"}
    except BaseException:
        zipped.close()
        raise


def extract_prepared(context, output, limit=1000, *, after=""):
    if not 1 <= limit <= 1000:
        raise ValueError("Limit must be 1..1000")
    if after and after not in context["members"]:
        raise ValueError("Cursor is not an indexed archive member")
    for path, size, modified in context["stats"]:
        if (path.stat().st_size, path.stat().st_mtime_ns) != (size, modified):
            raise ValueError("Source changed during extraction")
    output.mkdir(parents=True, exist_ok=True, mode=0o700)
    remaining = [name for name in context["selected"] if name > after]
    total, records, quarantined, processed = 0, [], [], []
    for name in remaining[:limit]:
        row, info = context["wanted"][name], context["members"][name]
        if not 0 <= info.file_size <= 16_000_000:
            quarantined.append({"member": name, "ein": row["EIN"].zfill(9), "object_id": row["OBJECT_ID"],
                                "bytes": info.file_size, "reason": "member_exceeds_16mb_budget",
                                "source_url": context["source_url"] + "#" + name})
            processed.append(name)
            continue
        if total + info.file_size > 100_000_000:
            break
        content = read_member(context["zipped"], info)
        total += len(content)
        target = output / name
        if target.exists():
            if target.read_bytes() != content:
                raise ValueError("Existing XML differs; preserve immutable snapshot")
        else:
            with target.open("xb") as stream:
                stream.write(content)
            target.chmod(0o600)
        item = {"ein": row["EIN"].zfill(9), "object_id": row["OBJECT_ID"],
                "source_url": context["source_url"] + "#" + name, "index_row": row,
                "xml_sha256": hashlib.sha256(content).hexdigest(), "bytes": len(content)}
        sidecar = target.with_suffix(".source.json")
        if sidecar.exists():
            if json.loads(sidecar.read_text()) != item:
                raise ValueError("Existing provenance differs")
        else:
            sidecar.write_text(json.dumps(item, indent=2))
            sidecar.chmod(0o600)
        records.append(item)
        processed.append(name)
    return {"source_url": context["source_url"], **context["binding"],
            "observed_at": datetime.now(timezone.utc).isoformat(), "matched": len(context["wanted"]),
            "missing_count": len(context["missing"]), "missing_members": context["missing"],
            "available": len(context["selected"]), "after": after,
            "last_member": processed[-1] if processed else after,
            "deferred_by_limit": len(remaining) - len(processed),
            "quarantined": quarantined, "processed": len(processed),
            "extracted": len(records), "uncompressed_bytes": total, "records": records}


def extract(index, archive, state, output, limit=1000, *, index_batch=None, allow_missing=False, after=""):
    # Standalone calls validate inputs once; bulk runs retain this prepared reader.
    output.mkdir(parents=True, exist_ok=True, mode=0o700)
    context = prepare(index, archive, state, index_batch=index_batch, allow_missing=allow_missing)
    try:
        return extract_prepared(context, output, limit, after=after)
    finally:
        context["zipped"].close()


if __name__ == "__main__":
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ["index", "archive", "state", "output", "manifest"]:
        parser.add_argument("--" + arg, required=True, type=Path)
    parser.add_argument("--limit", type=int, default=1000)
    parser.add_argument("--after", default="", help="Exclusive member cursor from previous manifest")
    parser.add_argument("--index-batch", help="Explicit same-month index label for split IRS archives")
    parser.add_argument("--allow-missing-members", action="store_true", help="Record absent index members for sibling-archive reconciliation")
    args = parser.parse_args()
    if args.manifest.exists():
        raise ValueError("Manifest exists; choose new output")
    result = extract(args.index, args.archive, args.state, args.output, args.limit,
                     index_batch=args.index_batch, allow_missing=args.allow_missing_members, after=args.after)
    with args.manifest.open("x") as stream:
        json.dump(result, stream, indent=2)
    print(json.dumps({k:v for k,v in result.items() if k not in ("records", "missing_members")}))
