from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from parse_timeline import parse_source  # noqa: E402

SOURCE = ROOT / "docs/source/magpie-dashboards-timeline-item-details.md"
SEED = ROOT / "src/data/timeline.seed.json"
EXPECTED_COUNTS = {
    "Eng Build": 15,
    "Product Build": 5,
    "Product Discovery": 6,
    "Processes": 4,
    "Challenges Planned / Unplanned": 8,
    "In-Flight / Future": 7,
}


def fail(message: str) -> None:
    raise AssertionError(message)


def main() -> None:
    expected = parse_source(SOURCE)
    actual = json.loads(SEED.read_text(encoding="utf-8"))

    if len(actual["items"]) != 45:
        fail(f"Expected 45 items, found {len(actual['items'])}")

    counts = Counter(item["lane"] for item in actual["items"])
    if dict(counts) != EXPECTED_COUNTS:
        fail(f"Lane counts differ: {dict(counts)}")

    ids = [item["id"] for item in actual["items"]]
    if len(ids) != len(set(ids)):
        fail("Timeline item IDs are not unique")

    target_by_id = {item["id"]: item for item in actual["items"]}
    for item in actual["items"]:
        if not 0 <= item["start"] <= item["end"] <= 11:
            fail(f"Invalid placement for {item['name']}")
        if not 1 <= len(item["guidingLights"]) <= 2:
            fail(f"Invalid Guiding Light count for {item['name']}")
        for relation in item["relations"]:
            target = target_by_id.get(relation["targetId"])
            if target is None:
                fail(f"Missing relation target from {item['name']}: {relation['targetId']}")
            if target["name"] != relation["targetName"]:
                fail(f"Relation label mismatch from {item['name']} to {target['name']}")
            if not relation["description"].strip():
                fail(f"Empty relation description on {item['name']}")

    duplicate = [item for item in actual["items"] if item["name"] == "ROAR Phoneme Rework"]
    if {item["lane"] for item in duplicate} != {"Eng Build", "Challenges Planned / Unplanned"}:
        fail("The intentional ROAR Phoneme Rework cross-lane duplicate is missing")

    source_fields = [
        "id",
        "name",
        "lane",
        "description",
        "placement",
        "value",
        "relations",
        "guidingLights",
        "start",
        "end",
        "planned",
        "ongoing",
        "colorToken",
        "media",
    ]
    expected_records = [{key: item[key] for key in source_fields} for item in expected["items"]]
    actual_records = [{key: item[key] for key in source_fields} for item in actual["items"]]
    if actual_records != expected_records:
        fail("Seed data differs from the parsed source-of-truth document")

    print("Timeline data verified: 45 items, 6 lanes, all relations resolved, source fidelity intact.")


if __name__ == "__main__":
    main()
