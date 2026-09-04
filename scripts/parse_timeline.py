from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

MONTHS = {
    "Jan": 0,
    "Feb": 1,
    "Mar": 2,
    "Apr": 3,
    "May": 4,
    "Jun": 5,
    "Jul": 6,
    "Aug": 7,
    "Sep": 8,
    "Oct": 9,
    "Nov": 10,
    "Dec": 11,
}

LANE_DISPLAY = {
    "Eng Build": "Eng Build",
    "Product Build": "Product Build",
    "Product Discovery": "Product Discovery",
    "Processes": "Processes",
    "Challenges Planned / Unplanned": "Curve balls",
    "In-Flight / Future": "In-Flight / Future",
}

LIGHT_TO_COLOR = {
    "Learn": "graphite",
    "Fix": "signal",
    "Stabilize": "steel",
    "Govern": "umber",
    "Grow": "forest",
}


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value


def parse_placement(value: str) -> tuple[int, int, bool, bool]:
    clean = value.replace("(ongoing)", "").replace("(planned)", "").strip()
    match = re.match(r"([A-Z][a-z]{2})\s*-\s*([A-Z][a-z]{2})", clean)
    if not match:
        raise ValueError(f"Unsupported placement: {value}")
    start = MONTHS[match.group(1)]
    end = MONTHS[match.group(2)]
    return start, end, "planned" in value, "ongoing" in value


def parse_source(source_path: Path) -> dict:
    lines = source_path.read_text(encoding="utf-8").splitlines()
    items: list[dict] = []
    current_lane: str | None = None
    current: dict | None = None
    active_field: str | None = None

    def flush() -> None:
        nonlocal current
        if current is None:
            return
        required = ["name", "description", "placement", "value", "guidingLights"]
        missing = [field for field in required if not current.get(field)]
        if missing:
            raise ValueError(f"Missing {missing} for {current.get('name')}")
        start, end, planned, ongoing = parse_placement(current["placement"])
        current["start"] = start
        current["end"] = end
        current["planned"] = planned
        current["ongoing"] = ongoing
        current["colorToken"] = LIGHT_TO_COLOR[current["guidingLights"][0]]
        current["media"] = None
        current["relations"] = current.get("relations", [])
        items.append(current)
        current = None

    for raw in lines:
        lane_match = re.match(r"## Lane: (.+)", raw)
        if lane_match:
            flush()
            current_lane = lane_match.group(1).strip()
            active_field = None
            continue

        item_match = re.match(r"### (.+)", raw)
        if item_match and current_lane:
            flush()
            name = item_match.group(1).strip()
            current = {
                "id": f"{slugify(current_lane)}--{slugify(name)}",
                "name": name,
                "lane": current_lane,
                "description": "",
                "placement": "",
                "value": "",
                "relations": [],
                "guidingLights": [],
            }
            active_field = None
            continue

        if current is None:
            continue

        field_match = re.match(r"- \*\*(Description|Placement|Value|Lane|Relates to|Guiding Light):\*\*(?:\s*(.*))?", raw)
        if field_match:
            label, value = field_match.groups()
            active_field = label
            value = (value or "").strip()
            if label == "Description":
                current["description"] = value
            elif label == "Placement":
                current["placement"] = value
            elif label == "Value":
                current["value"] = value
            elif label == "Guiding Light":
                current["guidingLights"] = [part.strip() for part in value.split(",") if part.strip()]
            continue

        relation_match = re.match(r"\s{2}- (.+)", raw)
        if active_field == "Relates to" and relation_match:
            current["relations"].append(
                {"raw": relation_match.group(1).strip(), "targetName": "", "description": "", "targetId": None}
            )

    flush()

    by_name: dict[str, list[dict]] = {}
    for item in items:
        by_name.setdefault(item["name"], []).append(item)

    ordered_names = sorted(by_name, key=len, reverse=True)
    for item in items:
        for relation in item["relations"]:
            raw_relation = relation.pop("raw")
            raw_target = next(
                (name for name in ordered_names if raw_relation.startswith(f"{name}:")),
                None,
            )
            explicit_lane = None
            if raw_target is None:
                lane_match = re.match(
                    r"(.+?) \((Eng Build|Product Build|Product Discovery|Processes|Challenges Planned / Unplanned|In-Flight / Future)\): (.+)",
                    raw_relation,
                )
                if lane_match:
                    raw_target, explicit_lane, description = lane_match.groups()
                else:
                    raise ValueError(f"Could not parse relation '{raw_relation}' from '{item['name']}'")
            else:
                description = raw_relation[len(raw_target) + 1 :].strip()

            candidates = by_name.get(raw_target, [])
            if explicit_lane:
                candidates = [candidate for candidate in candidates if candidate["lane"] == explicit_lane]
            if len(candidates) > 1:
                preferred = [candidate for candidate in candidates if candidate["lane"] != "Challenges Planned / Unplanned"]
                candidates = preferred or candidates
            if not candidates:
                raise ValueError(f"Could not resolve relation target '{raw_target}' from '{item['name']}'")
            relation["targetId"] = candidates[0]["id"]
            relation["targetName"] = candidates[0]["name"]
            relation["description"] = description

    lanes = []
    for index, lane in enumerate(LANE_DISPLAY):
        lanes.append(
            {
                "id": slugify(lane),
                "name": lane,
                "displayName": LANE_DISPLAY[lane],
                "index": index + 1,
            }
        )

    return {
        "version": 1,
        "updatedAt": "2026-09-03T00:00:00.000Z",
        "meta": {
            "title": "Magpie Dashboards",
            "subtitle": "Product leadership through rebuild, recovery, and scale",
            "owner": "Rico Garcia",
            "period": "January–September 2026",
        },
        "lanes": lanes,
        "items": items,
    }


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: parse_timeline.py SOURCE.md OUTPUT.json")
    payload = parse_source(Path(sys.argv[1]))
    output = Path(sys.argv[2])
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(payload['items'])} timeline items to {output}")


if __name__ == "__main__":
    main()
