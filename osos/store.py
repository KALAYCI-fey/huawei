"""SQLite persistence for OSOS subscriber, consumption, and profile data."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
    serno INTEGER PRIMARY KEY,
    identifier TEXT,
    title TEXT,
    email TEXT,
    address TEXT,
    phone TEXT,
    raw_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
    subscription_serno INTEGER PRIMARY KEY,
    tesisat TEXT,
    identifier_sec TEXT,
    definition_type INTEGER,
    definition_type_name TEXT,
    title TEXT,
    address TEXT,
    meter_serial TEXT,
    meter_brand TEXT,
    meter_model TEXT,
    multiplier REAL,
    etso TEXT,
    group_info TEXT,
    installed_power REAL,
    accord_power REAL,
    last_endex_date INTEGER,
    last_profile_date INTEGER,
    raw_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS monthly_endex (
    owner_serno INTEGER NOT NULL,
    current_term INTEGER NOT NULL,
    direction TEXT NOT NULL,
    first_endex REAL,
    last_endex REAL,
    t1_kwh REAL,
    t2_kwh REAL,
    t3_kwh REAL,
    active_kwh REAL,
    inductive_kvarh REAL,
    capacitive_kvarh REAL,
    ri_rate REAL,
    rc_rate REAL,
    raw_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (owner_serno, current_term, direction)
);

CREATE TABLE IF NOT EXISTS consumptions (
    owner_serno INTEGER NOT NULL,
    profile_date INTEGER NOT NULL,
    consumption_kwh REAL,
    generation_kwh REAL,
    inductive_kvarh REAL,
    capacitive_kvarh REAL,
    inductive_out_kvarh REAL,
    capacitive_out_kvarh REAL,
    multiplier REAL,
    status INTEGER,
    raw_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (owner_serno, profile_date)
);

CREATE TABLE IF NOT EXISTS load_profiles (
    owner_serno INTEGER NOT NULL,
    profile_date INTEGER NOT NULL,
    t_sum REAL,
    t_sum_out REAL,
    inductive REAL,
    inductive_out REAL,
    capacitive REAL,
    capacitive_out REAL,
    multiplier REAL,
    raw_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (owner_serno, profile_date)
);

CREATE TABLE IF NOT EXISTS current_endexes (
    owner_serno INTEGER NOT NULL,
    endex_date INTEGER NOT NULL,
    sensor_serno INTEGER,
    t1 REAL,
    t2 REAL,
    t3 REAL,
    t_sum REAL,
    inductive REAL,
    capacitive REAL,
    max_demand REAL,
    raw_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (owner_serno, endex_date)
);

CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    job TEXT NOT NULL,
    status TEXT NOT NULL,
    detail TEXT
);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


class OsosStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.path)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)

    def close(self) -> None:
        self.conn.close()

    def log_start(self, job: str) -> int:
        cur = self.conn.execute(
            "INSERT INTO sync_log (started_at, job, status) VALUES (?, ?, ?)",
            (_now(), job, "running"),
        )
        self.conn.commit()
        return int(cur.lastrowid)

    def log_finish(self, log_id: int, status: str, detail: Any = None) -> None:
        self.conn.execute(
            "UPDATE sync_log SET finished_at = ?, status = ?, detail = ? WHERE id = ?",
            (_now(), status, _dumps(detail) if detail is not None else None, log_id),
        )
        self.conn.commit()

    def upsert_customer(self, login: dict[str, Any]) -> None:
        props = login.get("Properties") or {}
        self.conn.execute(
            """
            INSERT INTO customers (serno, identifier, title, email, address, phone, raw_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(serno) DO UPDATE SET
                identifier=excluded.identifier,
                title=excluded.title,
                email=excluded.email,
                address=excluded.address,
                phone=excluded.phone,
                raw_json=excluded.raw_json,
                updated_at=excluded.updated_at
            """,
            (
                login.get("Serno"),
                login.get("IdentifierValue"),
                props.get("100001"),
                props.get("100002"),
                props.get("100004"),
                props.get("100007"),
                _dumps(_public_login(login)),
                _now(),
            ),
        )
        self.conn.commit()

    def upsert_subscribers(self, rows: Iterable[dict[str, Any]]) -> int:
        count = 0
        from osos.client import DEFINITION_TYPES

        for row in rows:
            definition_type = row.get("DefinitionType")
            self.conn.execute(
                """
                INSERT INTO subscribers (
                    subscription_serno, tesisat, identifier_sec, definition_type,
                    definition_type_name, title, address, meter_serial, meter_brand,
                    meter_model, multiplier, etso, group_info, installed_power,
                    accord_power, last_endex_date, last_profile_date, raw_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(subscription_serno) DO UPDATE SET
                    tesisat=excluded.tesisat,
                    identifier_sec=excluded.identifier_sec,
                    definition_type=excluded.definition_type,
                    definition_type_name=excluded.definition_type_name,
                    title=excluded.title,
                    address=excluded.address,
                    meter_serial=excluded.meter_serial,
                    meter_brand=excluded.meter_brand,
                    meter_model=excluded.meter_model,
                    multiplier=excluded.multiplier,
                    etso=excluded.etso,
                    group_info=excluded.group_info,
                    installed_power=excluded.installed_power,
                    accord_power=excluded.accord_power,
                    last_endex_date=excluded.last_endex_date,
                    last_profile_date=excluded.last_profile_date,
                    raw_json=excluded.raw_json,
                    updated_at=excluded.updated_at
                """,
                (
                    row.get("SubscriptionSerno"),
                    row.get("IdentifierValue"),
                    row.get("IdentifierValueSec"),
                    definition_type,
                    DEFINITION_TYPES.get(definition_type, str(definition_type)),
                    row.get("Title"),
                    row.get("Address"),
                    row.get("MeterSerial"),
                    row.get("MeterBrand"),
                    row.get("MeterModel"),
                    row.get("Multiplier"),
                    row.get("Etso"),
                    row.get("GroupInfo"),
                    row.get("InstalledPower"),
                    row.get("AccordPower"),
                    row.get("LastEndexDate"),
                    row.get("LastProfileDate"),
                    _dumps(row),
                    _now(),
                ),
            )
            count += 1
        self.conn.commit()
        return count

    def upsert_monthly_endex(self, owner_serno: int, rows: Iterable[dict[str, Any]]) -> int:
        count = 0
        for row in rows:
            for direction, key in (("in", "InValue"), ("out", "OutValue")):
                value = row.get(key) or {}
                if not value:
                    continue
                self.conn.execute(
                    """
                    INSERT INTO monthly_endex (
                        owner_serno, current_term, direction, first_endex, last_endex,
                        t1_kwh, t2_kwh, t3_kwh, active_kwh, inductive_kvarh, capacitive_kvarh,
                        ri_rate, rc_rate, raw_json, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(owner_serno, current_term, direction) DO UPDATE SET
                        first_endex=excluded.first_endex,
                        last_endex=excluded.last_endex,
                        t1_kwh=excluded.t1_kwh,
                        t2_kwh=excluded.t2_kwh,
                        t3_kwh=excluded.t3_kwh,
                        active_kwh=excluded.active_kwh,
                        inductive_kvarh=excluded.inductive_kvarh,
                        capacitive_kvarh=excluded.capacitive_kvarh,
                        ri_rate=excluded.ri_rate,
                        rc_rate=excluded.rc_rate,
                        raw_json=excluded.raw_json,
                        updated_at=excluded.updated_at
                    """,
                    (
                        owner_serno,
                        row.get("CurrentTerm"),
                        direction,
                        value.get("FirstEndexValue"),
                        value.get("LastEndexValue"),
                        value.get("MultipliedT1EndexDifference"),
                        value.get("MultipliedT2EndexDifference"),
                        value.get("MultipliedT3EndexDifference"),
                        value.get("MultipliedEndexDifference"),
                        value.get("MultipliedRIDiff"),
                        value.get("MultipliedRCDiff"),
                        value.get("RIRate"),
                        value.get("RCRate"),
                        _dumps(row),
                        _now(),
                    ),
                )
                count += 1
        self.conn.commit()
        return count

    def upsert_consumptions(self, owner_serno: int, rows: Iterable[dict[str, Any]]) -> int:
        count = 0
        for row in rows:
            self.conn.execute(
                """
                INSERT INTO consumptions (
                    owner_serno, profile_date, consumption_kwh, generation_kwh,
                    inductive_kvarh, capacitive_kvarh, inductive_out_kvarh,
                    capacitive_out_kvarh, multiplier, status, raw_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(owner_serno, profile_date) DO UPDATE SET
                    consumption_kwh=excluded.consumption_kwh,
                    generation_kwh=excluded.generation_kwh,
                    inductive_kvarh=excluded.inductive_kvarh,
                    capacitive_kvarh=excluded.capacitive_kvarh,
                    inductive_out_kvarh=excluded.inductive_out_kvarh,
                    capacitive_out_kvarh=excluded.capacitive_out_kvarh,
                    multiplier=excluded.multiplier,
                    status=excluded.status,
                    raw_json=excluded.raw_json,
                    updated_at=excluded.updated_at
                """,
                (
                    owner_serno,
                    row.get("pd"),
                    row.get("cn"),
                    row.get("gn"),
                    row.get("ri"),
                    row.get("rc"),
                    row.get("rio"),
                    row.get("rco"),
                    row.get("ml"),
                    row.get("st"),
                    _dumps(row),
                    _now(),
                ),
            )
            count += 1
        self.conn.commit()
        return count

    def upsert_load_profiles(self, owner_serno: int, rows: Iterable[dict[str, Any]]) -> int:
        count = 0
        for row in rows:
            self.conn.execute(
                """
                INSERT INTO load_profiles (
                    owner_serno, profile_date, t_sum, t_sum_out, inductive,
                    inductive_out, capacitive, capacitive_out, multiplier, raw_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(owner_serno, profile_date) DO UPDATE SET
                    t_sum=excluded.t_sum,
                    t_sum_out=excluded.t_sum_out,
                    inductive=excluded.inductive,
                    inductive_out=excluded.inductive_out,
                    capacitive=excluded.capacitive,
                    capacitive_out=excluded.capacitive_out,
                    multiplier=excluded.multiplier,
                    raw_json=excluded.raw_json,
                    updated_at=excluded.updated_at
                """,
                (
                    owner_serno,
                    row.get("ProfileDate"),
                    row.get("TSum"),
                    row.get("TSumOut"),
                    row.get("ReactiveInductive"),
                    row.get("ReactiveInductiveOut"),
                    row.get("ReactiveCapasitive"),
                    row.get("ReactiveCapasitiveOut"),
                    row.get("Multiplier"),
                    _dumps(row),
                    _now(),
                ),
            )
            count += 1
        self.conn.commit()
        return count

    def upsert_current_endexes(self, owner_serno: int, rows: Iterable[dict[str, Any]]) -> int:
        count = 0
        for row in rows:
            self.conn.execute(
                """
                INSERT INTO current_endexes (
                    owner_serno, endex_date, sensor_serno, t1, t2, t3, t_sum,
                    inductive, capacitive, max_demand, raw_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(owner_serno, endex_date) DO UPDATE SET
                    sensor_serno=excluded.sensor_serno,
                    t1=excluded.t1,
                    t2=excluded.t2,
                    t3=excluded.t3,
                    t_sum=excluded.t_sum,
                    inductive=excluded.inductive,
                    capacitive=excluded.capacitive,
                    max_demand=excluded.max_demand,
                    raw_json=excluded.raw_json,
                    updated_at=excluded.updated_at
                """,
                (
                    owner_serno,
                    row.get("EndexDate"),
                    row.get("SensorSerno"),
                    row.get("T1Endex"),
                    row.get("T2Endex"),
                    row.get("T3Endex"),
                    row.get("TSum"),
                    row.get("ReactiveInductive"),
                    row.get("ReactiveCapasitive"),
                    row.get("MaxDemand"),
                    _dumps(row),
                    _now(),
                ),
            )
            count += 1
        self.conn.commit()
        return count

    def counts(self) -> dict[str, int]:
        tables = [
            "customers",
            "subscribers",
            "monthly_endex",
            "consumptions",
            "load_profiles",
            "current_endexes",
        ]
        out: dict[str, int] = {}
        for table in tables:
            out[table] = int(self.conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])
        return out

    def list_subscribers(self) -> list[sqlite3.Row]:
        return list(
            self.conn.execute(
                "SELECT subscription_serno, tesisat, definition_type, definition_type_name, "
                "title, meter_brand, meter_serial, multiplier, etso FROM subscribers "
                "ORDER BY tesisat"
            )
        )


def _public_login(login: dict[str, Any]) -> dict[str, Any]:
    """Persist login metadata without session secrets."""
    public = dict(login)
    public.pop("SessionKey", None)
    props = dict(public.get("Properties") or {})
    for secret_key in ("100401", "100400"):
        props.pop(secret_key, None)
    public["Properties"] = props
    return public
