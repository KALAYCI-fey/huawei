from datetime import datetime

from osos.compare import compare_hourly
from osos.dates import TZ, datetime_to_millis, millis_to_long
from osos.mapping import export_mapping_csv, import_mapping_csv, suggest_mappings
from osos.store import OsosStore


def test_suggest_maps_generation_plant_by_name():
    subscribers = [
        {
            "tesisat": "10000091010",
            "etso": "40Z000136394654X",
            "title": "AFYON DOMATES MADEN SANAYİ",
            "address": "AFYONKARAHİSAR",
            "definition_type_name": "GenerationPlant",
        },
        {
            "tesisat": "10000032230",
            "etso": "40Z000002606920J",
            "title": "BAZALTO MADENCİLİK",
            "address": "SUSUZ BELDESİ",
            "definition_type_name": "Subscriber",
        },
    ]
    plants = [
        {"plant_code": "NE=111", "plant_name": "Afyon Domates GES", "plant_address": "Afyonkarahisar"},
        {"plant_code": "NE=222", "plant_name": "Bazalto Madencilik", "plant_address": "Susuz"},
    ]
    suggestions = suggest_mappings(subscribers, plants, min_score=0.4)
    by_tesisat = {row["tesisat"]: row["plant_code"] for row in suggestions}
    assert by_tesisat["10000091010"] == "NE=111"
    assert by_tesisat["10000032230"] == "NE=222"


def test_csv_roundtrip(tmp_path):
    path = tmp_path / "map.csv"
    export_mapping_csv(
        path,
        [
            {
                "tesisat": "10000091010",
                "etso": "40Z000136394654X",
                "definition_type_name": "GenerationPlant",
                "title": "GES",
                "address": "Afyon",
            }
        ],
        {"10000091010": {"plant_code": "NE=111", "plant_name": "GES 1"}},
    )
    rows = import_mapping_csv(path)
    assert rows[0]["tesisat"] == "10000091010"
    assert rows[0]["plant_code"] == "NE=111"


def test_csv_skips_empty_plant_code(tmp_path):
    path = tmp_path / "empty.csv"
    path.write_text("tesisat,plant_code\n10000091010,\n", encoding="utf-8")
    assert import_mapping_csv(path) == []


def test_hourly_alignment_and_compare(tmp_path):
    dt = datetime(2026, 9, 1, 8, 0, tzinfo=TZ)
    collect_ms = datetime_to_millis(dt)
    assert millis_to_long(collect_ms, "hour") == 20260901080000

    store = OsosStore(tmp_path / "map.db")
    store.upsert_subscribers(
        [
            {
                "SubscriptionSerno": 68628,
                "IdentifierValue": "10000091010",
                "DefinitionType": 15,
                "Title": "GES",
                "Etso": "40Z000136394654X",
            }
        ]
    )
    store.upsert_site_mapping(
        {
            "tesisat": "10000091010",
            "plant_code": "NE=111",
            "plant_name": "GES 1",
            "match_source": "manual",
        }
    )
    store.upsert_consumptions(
        68628,
        [{"pd": 20260901080000, "gn": 100.0, "cn": 0, "ri": 0, "rc": 0, "ml": 1, "st": 4}],
    )
    store.upsert_huawei_hourly(
        [
            {
                "stationCode": "NE=111",
                "collectTime": collect_ms,
                "dataItemMap": {"inverter_power": 96.5, "ongrid_power": 94.0},
            }
        ]
    )
    result = compare_hourly(store.hourly_compare_rows(20260901000000, 20260901235959))
    assert result["osos_kwh"] == 100.0
    assert result["huawei_kwh"] == 96.5
    assert result["delta_kwh"] == 3.5
    store.close()
