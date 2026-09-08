"""Compare OSOS generation/consumption with Huawei plant kWh."""

from __future__ import annotations

from typing import Any


def compare_hourly(rows: list[dict[str, Any]]) -> dict[str, Any]:
    items = []
    osos_sum = 0.0
    huawei_sum = 0.0
    missing = 0
    for row in rows:
        osos_kwh = _num(row.get("osos_kwh")) or 0.0
        huawei_kwh = _num(row.get("huawei_kwh"))
        osos_sum += osos_kwh
        if huawei_kwh is None:
            missing += 1
            delta = None
            ratio = None
        else:
            huawei_sum += huawei_kwh
            delta = round(osos_kwh - huawei_kwh, 4)
            ratio = None if huawei_kwh == 0 else round((osos_kwh - huawei_kwh) / huawei_kwh, 4)
        items.append(
            {
                "tesisat": row.get("tesisat"),
                "plant_code": row.get("plant_code"),
                "profile_date": row.get("profile_date"),
                "osos_kwh": osos_kwh,
                "huawei_kwh": huawei_kwh,
                "delta_kwh": delta,
                "delta_ratio": ratio,
            }
        )
    return {
        "rows": items,
        "osos_kwh": round(osos_sum, 4),
        "huawei_kwh": round(huawei_sum, 4),
        "delta_kwh": round(osos_sum - huawei_sum, 4),
        "missing_huawei_hours": missing,
    }


def _num(value: Any) -> float | None:
    if value is None or value == "":
        return None
    return float(value)
