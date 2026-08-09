#!/usr/bin/env python3
import argparse
import json
import re

import pdfplumber

CONNECTOR_WORDS = {"and", "at", "for", "in", "of", "on", "the", "to", "with"}


def repair_lines(value):
    lines = [re.sub(r"\s+", " ", line).strip() for line in (value or "").splitlines()]
    lines = [line for line in lines if line]
    repaired = []
    for line in lines:
        if not repaired:
            repaired.append(line)
            continue
        previous = repaired[-1]
        if previous.endswith("-"):
            repaired[-1] = previous + line
        elif previous[-1:].islower() and line[:1].islower():
            first_word = line.split(" ", 1)[0].lower()
            if first_word not in CONNECTOR_WORDS and len(first_word) <= 4:
                repaired[-1] = previous + line
            else:
                repaired.append(line)
        else:
            repaired.append(line)
    return "\n".join(repaired)


def normalize_url(value):
    return re.sub(r"\s+", "", value or "").strip()


def merge_value(previous, current):
    values = [value for value in [previous, current] if value]
    return "\n".join(values)


def is_continuation_row(previous, current):
    if not previous or current["website"]:
        return False
    previous_address = previous.get("address", "")
    current_has_details = sum(bool(current[key]) for key in current if key != "website") >= 3
    previous_address_incomplete = not re.search(
        r"\bIL\b[^\d]*\d{5}\b", previous_address, flags=re.IGNORECASE
    )
    return current_has_details and previous_address_incomplete


def extract_records(input_path):
    records = []
    with pdfplumber.open(input_path) as document:
        for page in document.pages:
            tables = page.extract_tables()
            if not tables:
                continue
            for row in tables[0]:
                cells = list(row or []) + [None] * 6
                name, website, address, service_area, services, community = cells[:6]
                if (name or "").replace("\n", " ").strip().lower().startswith(
                    "organization name"
                ):
                    continue
                normalized = {
                    "name": repair_lines(name).replace("\n", " "),
                    "website": normalize_url(website),
                    "address": repair_lines(address).replace("\n", " "),
                    "serviceArea": repair_lines(service_area).replace("\n", " "),
                    "services": repair_lines(services),
                    "communityServed": repair_lines(community).replace("\n", " "),
                }
                if (not normalized["name"] or is_continuation_row(records[-1] if records else None, normalized)) and records:
                    for key in normalized:
                        records[-1][key] = merge_value(records[-1][key], normalized[key])
                    continue
                if normalized["name"]:
                    records.append(normalized)
    return records


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()
    print(json.dumps(extract_records(args.input), ensure_ascii=True))


if __name__ == "__main__":
    main()
