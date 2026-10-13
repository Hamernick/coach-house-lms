import importlib.util
import csv
import json
from pathlib import Path
import sqlite3
import subprocess
import struct
import shutil
import tempfile
import unittest
from unittest.mock import patch
import zipfile
import zlib

SERVER = Path(__file__).resolve().parents[1] / "server"

def module(name, file):
    spec = importlib.util.spec_from_file_location(name, SERVER / file)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

archive_module = module("archive", "extract-irs-archive.py")
parser_module = module("parser", "parse-filings.py")

class ArchiveTests(unittest.TestCase):
    @unittest.skipUnless(shutil.which("node"), "Node 22.13+ required")
    def test_archive_runner_advances_resumes_and_rejects_changed_inputs(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with sqlite3.connect(root / "research.sqlite") as db:
                db.execute("CREATE TABLE organizations(ein TEXT PRIMARY KEY)")
                db.execute("INSERT INTO organizations VALUES ('123456789')")
            index = root / "index.csv"
            batch = "2026_TEOS_XML_01A"
            index.write_text("EIN,XML_BATCH_ID,OBJECT_ID\n" + "".join(
                f"123456789,{batch},20260018933930005{n}\n" for n in range(3)))
            archive = root / (batch + ".zip")
            with zipfile.ZipFile(archive, "w") as zipped:
                for n in range(3):
                    zipped.writestr(f"20260018933930005{n}_public.xml",
                                    f"<Return><ReturnHeader><Filer><EIN>123456789</EIN></Filer></ReturnHeader>"
                                    f"<ReturnData><IRS990><MissionDesc>Mission {n}</MissionDesc></IRS990></ReturnData></Return>")
            output = root / "run"
            command = ["python3", str(SERVER / "enrich-irs-archive.py"), "--index", str(index),
                       "--archive", str(archive), "--state", str(root), "--output", str(output),
                       "--node", shutil.which("node"), "--limit", "1", "--write"]
            subprocess.run(command, capture_output=True, text=True, check=True)
            first = output / "batch-00001/completed.json"
            original = first.read_bytes()
            self.assertFalse((output / "complete.json").exists())
            # Simulate lost process acknowledgment: committed source is replayed.
            first.unlink()
            subprocess.run(command + ["--all"], capture_output=True, text=True, check=True)
            self.assertEqual(json.loads(first.read_text())["counts"]["replayed"], 1)
            self.assertEqual(json.loads((output / "complete.json").read_text())["batches"], 3)
            with sqlite3.connect(root / "research.sqlite") as db:
                self.assertEqual(db.execute("SELECT count(*) FROM evidence").fetchone()[0], 3)
            subprocess.run(command + ["--all"], capture_output=True, text=True, check=True)
            self.assertNotEqual(first.read_bytes(), original)
            index.write_text(index.read_text() + "\n")
            failed = subprocess.run(command, capture_output=True, text=True)
            self.assertNotEqual(failed.returncode, 0)
            self.assertIn("changed", failed.stderr)

    def test_prepared_cursor_and_provenance_cannot_skip_or_change(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with sqlite3.connect(root / "research.sqlite") as db:
                db.execute("CREATE TABLE organizations(ein TEXT)")
                db.execute("INSERT INTO organizations VALUES ('123456789')")
            index = root / "index.csv"
            index.write_text("EIN,XML_BATCH_ID,OBJECT_ID\n123456789,2026_TEOS_XML_01A,202600189339300050\n")
            archive = root / "2026_TEOS_XML_01A.zip"
            with zipfile.ZipFile(archive, "w") as zipped:
                zipped.writestr("202600189339300050_public.xml", "<Return/>")
            context = archive_module.prepare(index, archive, root)
            try:
                with self.assertRaisesRegex(ValueError, "Cursor"):
                    archive_module.extract_prepared(context, root / "xml", after="invented")
                report = archive_module.extract_prepared(context, root / "xml")
                self.assertEqual(archive_module.extract_prepared(context, root / "next", after=report["last_member"])["extracted"], 0)
                sidecar = next((root / "xml").glob("*.source.json"))
                sidecar.write_text("{}")
                with self.assertRaisesRegex(ValueError, "provenance differs"):
                    archive_module.extract_prepared(context, root / "xml")
            finally:
                context["zipped"].close()

    def test_oversized_member_is_quarantined_without_blocking_later_members(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with sqlite3.connect(root / "research.sqlite") as db:
                db.execute("CREATE TABLE organizations(ein TEXT)")
                db.execute("INSERT INTO organizations VALUES ('123456789')")
            index = root / "index.csv"
            index.write_text("EIN,XML_BATCH_ID,OBJECT_ID\n" + "".join(
                f"123456789,2026_TEOS_XML_01A,20260018933930005{n}\n" for n in range(2)))
            archive = root / "2026_TEOS_XML_01A.zip"
            with zipfile.ZipFile(archive, "w") as zipped:
                for n in range(2): zipped.writestr(f"20260018933930005{n}_public.xml", "<Return/>")
            context = archive_module.prepare(index, archive, root)
            try:
                first = context["selected"][0]
                context["members"][first].file_size = 16_000_001
                with patch.object(archive_module, "read_member", wraps=archive_module.read_member) as read:
                    skipped = archive_module.extract_prepared(context, root / "first", limit=1)
                    self.assertEqual(read.call_count, 0)
                self.assertEqual(skipped["extracted"], 0)
                self.assertEqual(skipped["last_member"], first)
                self.assertEqual(skipped["deferred_by_limit"], 1)
                self.assertEqual(skipped["quarantined"][0]["reason"], "member_exceeds_16mb_budget")
                next_batch = archive_module.extract_prepared(context, root / "next", after=first)
                self.assertEqual(next_batch["extracted"], 1)
                self.assertEqual(next_batch["deferred_by_limit"], 0)
            finally: context["zipped"].close()

    def deflate64_fixture(self, path, content):
        # One uncompressed DEFLATE block is valid in Deflate64 as well. Start
        # with a stdlib envelope, then set method/decoded size/CRC independently.
        block = b"\x01" + struct.pack("<HH", len(content), len(content) ^ 0xffff) + content
        with zipfile.ZipFile(path, "w") as zipped:
            zipped.writestr("nested/123_public.xml", block)
        data = bytearray(path.read_bytes())
        central = data.index(b"PK\x01\x02")
        struct.pack_into("<H", data, 8, 9)
        struct.pack_into("<I", data, 14, zlib.crc32(content))
        struct.pack_into("<I", data, 22, len(content))
        struct.pack_into("<H", data, central + 10, 9)
        struct.pack_into("<I", data, central + 16, zlib.crc32(content))
        struct.pack_into("<I", data, central + 24, len(content))
        path.write_bytes(data)

    @unittest.skipUnless(shutil.which("unzip"), "System unzip required for Deflate64")
    def test_deflate64_exact_content_crc_and_metadata_guards(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "method9.zip"
            content = b"<Return>" + b"real bounded XML " * 100 + b"</Return>"
            self.deflate64_fixture(path, content)
            with zipfile.ZipFile(path) as zipped:
                info = zipped.infolist()[0]
                self.assertEqual(archive_module.read_member(zipped, info), content)
                info.CRC ^= 1
                with self.assertRaises(ValueError):
                    archive_module.read_member(zipped, info)
                info.CRC ^= 1
                info.file_size = 16_000_001
                with self.assertRaisesRegex(ValueError, "byte budget"):
                    archive_module.read_member(zipped, info)
                info.file_size = len(content)
                info.flag_bits = 1
                with self.assertRaisesRegex(ValueError, "Encrypted"):
                    archive_module.read_member(zipped, info)
                info.flag_bits = 0
                info.orig_filename = "different.xml"
                with self.assertRaisesRegex(ValueError, "name mismatch"):
                    archive_module.read_member(zipped, info)

    def test_missing_deflate64_decoder_fails_without_partial_output(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "method9.zip"
            self.deflate64_fixture(path, b"<Return/>")
            with zipfile.ZipFile(path) as zipped, patch.object(archive_module.shutil, "which", return_value=None):
                with self.assertRaisesRegex(ValueError, "Deflate64 requires"):
                    archive_module.read_member(zipped, zipped.infolist()[0])

    def test_exact_ein_archive_selection_provenance_and_replay(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            db = sqlite3.connect(root / "research.sqlite")
            db.execute("CREATE TABLE organizations(ein TEXT)")
            db.execute("INSERT INTO organizations VALUES ('123456789')")
            db.commit()
            db.close()
            batch = "2026_TEOS_XML_01A"
            name = "202600189339300050_public.xml"
            index = root / "index.csv"
            with index.open("w", newline="") as stream:
                writer = csv.DictWriter(stream, fieldnames=["EIN", "XML_BATCH_ID", "OBJECT_ID"])
                writer.writeheader()
                writer.writerow({"EIN":"123456789", "XML_BATCH_ID":batch, "OBJECT_ID":name.split("_")[0]})
                writer.writerow({"EIN":"999999999", "XML_BATCH_ID":batch, "OBJECT_ID":"202600189339300051"})
            archive = root / (batch + ".zip")
            with zipfile.ZipFile(archive, "w") as zipped:
                zipped.writestr("../../" + name, '<Return><ReturnHeader><Filer><EIN>123456789</EIN></Filer></ReturnHeader><ReturnData><IRS990><WebsiteAddressTxt>example.org</WebsiteAddressTxt></IRS990></ReturnData></Return>')
            out = root / "output"
            report = archive_module.extract(index, archive, root, out)
            self.assertEqual(report["extracted"], 1)
            self.assertEqual(archive_module.extract(index, archive, root, out)["extracted"], 1)
            parsed = parser_module.parse(out / name)
            self.assertIn(batch + ".zip#", parsed["source_url"])
            sidecar = (out / name).with_suffix(".source.json")
            data = json.loads(sidecar.read_text())
            data["ein"] = "999999999"
            sidecar.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, "identity/content mismatch"):
                parser_module.parse(out / name)
            self.assertFalse((root / name).exists())

    def test_split_archive_requires_explicit_index_label_and_records_missing_members(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            db = sqlite3.connect(root / "research.sqlite")
            db.execute("CREATE TABLE organizations(ein TEXT)")
            db.execute("INSERT INTO organizations VALUES ('123456789')")
            db.commit()
            db.close()
            index = root / "index.csv"
            index.write_text("EIN,XML_BATCH_ID,OBJECT_ID\n123456789,2026_TEOS_XML_05A,202600189339300050\n123456789,2026_TEOS_XML_05A,202600189339300051\n")
            archive = root / "2026_TEOS_XML_05B.zip"
            name = "202600189339300050_public.xml"
            with zipfile.ZipFile(archive, "w") as zipped:
                zipped.writestr(name, "<Return/>")
            out = root / "output"
            with self.assertRaisesRegex(ValueError, "indexed members absent"):
                archive_module.extract(index, archive, root, out, index_batch="2026_TEOS_XML_05A")
            self.assertEqual(list(out.iterdir()), [])
            report = archive_module.extract(index, archive, root, out, index_batch="2026_TEOS_XML_05A", allow_missing=True)
            self.assertEqual((report["matched"], report["extracted"], report["missing_count"]), (2, 1, 1))
            self.assertIn("2026_TEOS_XML_05B.zip", report["records"][0]["source_url"])
            self.assertEqual(report["records"][0]["index_row"]["XML_BATCH_ID"], "2026_TEOS_XML_05A")
            with self.assertRaisesRegex(ValueError, "same year/month"):
                archive_module.extract(index, archive, root, out, index_batch="2026_TEOS_XML_04A")
            with zipfile.ZipFile(archive, "a") as zipped:
                zipped.writestr("other/" + name, "<Return/>")
            with self.assertRaisesRegex(ValueError, "duplicate"):
                archive_module.extract(index, archive, root, out, index_batch="2026_TEOS_XML_05A", allow_missing=True)

if __name__ == "__main__":
    unittest.main()
