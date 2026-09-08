"""Pull Huawei plant KPI data into the local store."""

from __future__ import annotations

import time
from typing import Any, Callable

from osos.huawei_client import HuaweiClient, iter_days
from osos.store import OsosStore

Progress = Callable[[str], None]


def sync_huawei(
    client: HuaweiClient,
    store: OsosStore,
    start_date: str,
    end_date: str,
    sleep_s: float = 1.5,
    log: Progress | None = None,
) -> dict[str, Any]:
    def say(message: str) -> None:
        if log:
            log(message)

    client.login()
    plants = client.get_plants()
    store.upsert_huawei_plants(plants)
    say(f"{len(plants)} Huawei santral yazıldı")

    codes = store.mapped_plant_codes()
    if not codes:
        codes = [plant["plant_code"] for plant in plants]
        say("Eşleme yok; tüm santraller çekilecek")
    else:
        say(f"{len(codes)} eşlenmiş santral çekilecek")

    stats = {"plants": len(plants), "hourly": 0, "daily": 0}
    if not codes:
        return stats

    months_seen: set[str] = set()
    for day in iter_days(start_date, end_date):
        say(f"Saatlik KPI {day}")
        hourly = client.get_hourly(codes, day)
        stats["hourly"] += store.upsert_huawei_hourly(hourly)
        month_key = day[:7]
        if month_key not in months_seen:
            say(f"Günlük KPI {month_key}")
            daily = client.get_daily(codes, day)
            stats["daily"] += store.upsert_huawei_daily(daily)
            months_seen.add(month_key)
        if sleep_s:
            time.sleep(sleep_s)
    return stats
