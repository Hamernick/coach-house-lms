"""Stream bounded, local IRS XML into evidence candidates. No network/dependencies."""
import hashlib
import json
import pathlib
import sys
from urllib.parse import urlparse
import xml.etree.ElementTree as ET


def parse(path):
    if path.stat().st_size > 16_000_000:
        raise ValueError("XML exceeds 16 MB")
    body = path.read_bytes()
    if b"<!DOCTYPE" in body.upper() or b"<!ENTITY" in body.upper():
        raise ValueError("DTD/entities prohibited")
    root = ET.fromstring(body)
    for node in root.iter():
        node.tag = node.tag.split("}")[-1]
    filer = root.find("./ReturnHeader/Filer")
    if filer is None:
        raise ValueError("Missing IRS ReturnHeader/Filer")
    text = lambda node, key: (node.findtext(key) or "").strip()
    ein = text(filer, "EIN")
    if len(ein) != 9 or not ein.isdigit():
        raise ValueError("Invalid filer EIN")
    data = root.find("./ReturnData/IRS990")
    if data is None:
        data = root.find("./ReturnData/IRS990EZ")
    if data is None:
        data = root.find("./ReturnData/IRS990PF")
    if data is None:
        raise ValueError("Unsupported return type")
    address = filer.find("USAddress")
    fields = {}
    for field, keys in {
        "website": ["WebsiteAddressTxt", "WebsiteAddress"],
        "phone": ["PhoneNum", "PhoneNumber"],
        "description": ["MissionDesc", "ActivityOrMissionDesc", "PrimaryExemptPurposeTxt"],
    }.items():
        value = next((text(data, k) for k in keys if text(data, k)), "")
        if field == "phone" and not value:
            value = text(filer, "PhoneNum")
        if value and value.upper() not in ("N/A", "NONE", "NA"):
            fields[field] = value[:16000]
    if address is not None:
        fields["filing_address"] = {n.tag: (n.text or "").strip() for n in address}
    source_url = "https://www.irs.gov/charities-non-profits/form-990-series-downloads"
    sidecar = path.with_suffix(".source.json")
    if sidecar.exists():
        if sidecar.stat().st_size > 16000:
            raise ValueError("Oversized provenance")
        provenance = json.loads(sidecar.read_text())
        if provenance.get("xml_sha256") != hashlib.sha256(body).hexdigest() or provenance.get("ein") != ein:
            raise ValueError("IRS index identity/content mismatch")
        url = urlparse(provenance.get("source_url", ""))
        if url.scheme != "https" or url.netloc != "apps.irs.gov" or not url.path.startswith("/pub/epostcard/990/xml/"):
            raise ValueError("Unrecognized IRS provenance URL")
        source_url = provenance["source_url"]
    return {
        "ein": ein, "fields": fields, "form": data.tag,
        "tax_year": root.findtext("./ReturnHeader/TaxYr"),
        "tax_period_end": root.findtext("./ReturnHeader/TaxPeriodEndDt"),
        "return_timestamp": root.findtext("./ReturnHeader/ReturnTs"),
        "amended": text(data, "AmendedReturnInd"),
        "source_path": str(path.resolve()),
        "source_sha256": hashlib.sha256(body).hexdigest(),
        "source_url": source_url,
    }


if __name__ == "__main__":
    # Paths are streamed on stdin to avoid process-per-filing overhead.
    for line in sys.stdin:
        if not line.strip():
            continue
        path = pathlib.Path(json.loads(line))
        try:
            result = parse(path)
        except Exception as exc:
            result = {"source_path": str(path), "error": str(exc)}
        print(json.dumps(result), flush=True)
