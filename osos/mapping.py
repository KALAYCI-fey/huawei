"""Match OSOS tesisat/ETSO records to Huawei FusionSolar plant codes."""

from __future__ import annotations

import csv
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Iterable

_TR = str.maketrans(
    {
        "Ç": "C",
        "Ğ": "G",
        "İ": "I",
        "I": "I",
        "Ö": "O",
        "Ş": "S",
        "Ü": "U",
        "ç": "C",
        "ğ": "G",
        "ı": "I",
        "i": "I",
        "ö": "O",
        "ş": "S",
        "ü": "U",
        "Â": "A",
        "Î": "I",
        "Û": "U",
    }
)


CSV_FIELDS = [
    "tesisat",
    "etso",
    "definition_type_name",
    "title",
    "address",
    "plant_code",
    "plant_name",
    "notes",
]


def normalize(text: str | None) -> str:
    if not text:
        return ""
    return "".join(ch for ch in text.translate(_TR).upper() if ch.isalnum())


def similarity(left: str | None, right: str | None) -> float:
    a, b = normalize(left), normalize(right)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if a in b or b in a:
        return 0.82
    return SequenceMatcher(None, a, b).ratio()


def score_pair(subscriber: dict[str, Any], plant: dict[str, Any]) -> float:
    name_score = similarity(subscriber.get("title"), plant.get("plant_name"))
    addr_score = similarity(subscriber.get("address"), plant.get("plant_address"))
    bonus = 0.1 if subscriber.get("definition_type_name") == "GenerationPlant" else 0.0
    return min(1.0, max(name_score, addr_score * 0.9) + bonus)


def suggest_mappings(
    subscribers: Iterable[dict[str, Any]],
    plants: Iterable[dict[str, Any]],
    min_score: float = 0.45,
) -> list[dict[str, Any]]:
    plants = [p for p in plants if p.get("plant_code")]
    suggestions = []
    used_plants: set[str] = set()
    ranked_subs = sorted(
        subscribers,
        key=lambda row: 0 if row.get("definition_type_name") == "GenerationPlant" else 1,
    )
    for subscriber in ranked_subs:
        scored = []
        for plant in plants:
            code = plant["plant_code"]
            if code in used_plants:
                continue
            scored.append((score_pair(subscriber, plant), plant))
        scored.sort(key=lambda item: item[0], reverse=True)
        if not scored or scored[0][0] < min_score:
            continue
        score, plant = scored[0]
        used_plants.add(plant["plant_code"])
        suggestions.append(
            {
                "tesisat": subscriber.get("tesisat"),
                "etso": subscriber.get("etso"),
                "title": subscriber.get("title"),
                "plant_code": plant["plant_code"],
                "plant_name": plant.get("plant_name"),
                "score": round(score, 3),
                "match_source": "suggest",
            }
        )
    return suggestions


def export_mapping_csv(
    path: str | Path,
    subscribers: Iterable[dict[str, Any]],
    mappings: dict[str, dict[str, Any]] | None = None,
) -> int:
    mappings = mappings or {}
    count = 0
    with Path(path).open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for row in subscribers:
            tesisat = str(row.get("tesisat") or "")
            mapped = mappings.get(tesisat) or {}
            writer.writerow(
                {
                    "tesisat": tesisat,
                    "etso": row.get("etso") or "",
                    "definition_type_name": row.get("definition_type_name") or "",
                    "title": row.get("title") or "",
                    "address": row.get("address") or "",
                    "plant_code": mapped.get("plant_code") or "",
                    "plant_name": mapped.get("plant_name") or "",
                    "notes": mapped.get("notes") or "",
                }
            )
            count += 1
    return count


def import_mapping_csv(path: str | Path) -> list[dict[str, Any]]:
    rows = []
    with Path(path).open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            tesisat = (raw.get("tesisat") or "").strip()
            plant_code = (raw.get("plant_code") or "").strip()
            if not tesisat or not plant_code:
                continue
            rows.append(
                {
                    "tesisat": tesisat,
                    "etso": (raw.get("etso") or "").strip() or None,
                    "plant_code": plant_code,
                    "plant_name": (raw.get("plant_name") or "").strip() or None,
                    "notes": (raw.get("notes") or "").strip() or None,
                    "match_source": "csv",
                }
            )
    return rows
