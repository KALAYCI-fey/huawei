"""Sync OSOS portal data into the local store."""

from __future__ import annotations

from typing import Any, Callable

from osos.client import ENDEX_DIRECTION_IN, OsosClient
from osos.store import OsosStore


Progress = Callable[[str], None]


def sync_all(
    client: OsosClient,
    store: OsosStore,
    start_date: str,
    end_date: str,
    include_profiles: bool = True,
    log: Progress | None = None,
) -> dict[str, Any]:
    def say(message: str) -> None:
        if log:
            log(message)

    login = client.login()
    store.upsert_customer(login)
    say(f"Oturum açıldı: {login.get('IdentifierValue')}")

    subscribers = client.get_subscriptions()
    store.upsert_subscribers(subscribers)
    say(f"{len(subscribers)} tesisat yazıldı")

    stats = {
        "subscribers": len(subscribers),
        "monthly_endex": 0,
        "consumptions": 0,
        "load_profiles": 0,
        "current_endexes": 0,
    }

    for item in subscribers:
        serno = int(item["SubscriptionSerno"])
        definition_type = int(item["DefinitionType"])
        tesisat = item.get("IdentifierValue")
        say(f"Tesisat {tesisat} ({serno}) çekiliyor")

        monthly = client.get_monthly_endex(
            serno,
            end_date,
            direction=ENDEX_DIRECTION_IN,
            owner_identifier=item.get("IdentifierValue"),
            owner_identifier_sec=item.get("IdentifierValueSec"),
        )
        stats["monthly_endex"] += store.upsert_monthly_endex(serno, monthly)

        consumption = client.get_consumptions(
            serno,
            definition_type,
            start_date,
            end_date,
            include_load_profiles=False,
        )
        stats["consumptions"] += store.upsert_consumptions(
            serno, consumption.get("MergedConsumptions") or []
        )

        if include_profiles:
            profiles = client.get_load_profiles(serno, start_date, end_date)
            stats["load_profiles"] += store.upsert_load_profiles(serno, profiles)

        endexes = client.get_current_endexes(serno, start_date, end_date)
        stats["current_endexes"] += store.upsert_current_endexes(serno, endexes)

    return stats
