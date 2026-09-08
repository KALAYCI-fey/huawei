"""Command-line interface for OEDAŞ OSOS import and Huawei site mapping."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

from osos.client import OsosClient, OsosError
from osos.compare import compare_hourly
from osos.config import env, load_dotenv, require_env
from osos.dates import parse_iso_date
from osos.huawei_client import DEFAULT_BASE_URL as HUAWEI_DEFAULT_URL
from osos.huawei_client import HuaweiClient, HuaweiError
from osos.huawei_sync import sync_huawei
from osos.mapping import export_mapping_csv, import_mapping_csv, suggest_mappings
from osos.store import OsosStore
from osos.sync import sync_all

TZ = ZoneInfo("Europe/Istanbul")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="OEDAŞ OSOS verisini çeker ve Huawei FusionSolar santralleriyle eşler."
    )
    parser.add_argument("--db", default=os.environ.get("OSOS_DB_PATH", "data/osos.db"))
    parser.add_argument(
        "--base-url",
        default=os.environ.get("OSOS_BASE_URL", "https://ososout.oedas.com.tr"),
    )
    parser.add_argument(
        "--huawei-base-url",
        default=os.environ.get("HUAWEI_BASE_URL", HUAWEI_DEFAULT_URL),
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("login", help="OSOS kimlik bilgilerini doğrula")
    sub.add_parser("subscribers", help="Abone/tesisat listesini senkronize et")
    sub.add_parser("status", help="Yerel depodaki kayıt sayılarını göster")

    sync = sub.add_parser("sync", help="OSOS abone, endeks, tüketim ve yük profili çek")
    sync.add_argument("--from", dest="start_date", help="Başlangıç (YYYY-MM-DD)")
    sync.add_argument("--to", dest="end_date", help="Bitiş (YYYY-MM-DD)")
    sync.add_argument("--no-profiles", action="store_true", help="15 dakikalık yük profili çekme")

    sub.add_parser("huawei-login", help="FusionSolar Northbound girişini doğrula")
    sub.add_parser("huawei-plants", help="Huawei santral listesini çek")

    h_sync = sub.add_parser("huawei-sync", help="Huawei saatlik/günlük üretimi çek")
    h_sync.add_argument("--from", dest="start_date", help="Başlangıç (YYYY-MM-DD)")
    h_sync.add_argument("--to", dest="end_date", help="Bitiş (YYYY-MM-DD)")
    h_sync.add_argument(
        "--sleep",
        type=float,
        default=1.5,
        help="İstekler arası bekleme (sn). Resmi limit ~1 istek/dk.",
    )

    export = sub.add_parser("map-export", help="Tesisat-santral eşleme CSV şablonu yaz")
    export.add_argument("--out", default="data/site_mappings.csv")
    export.add_argument("--generation-only", action="store_true")

    imp = sub.add_parser("map-import", help="CSV'den tesisat → plant_code eşlemesi yükle")
    imp.add_argument("--file", required=True)

    setter = sub.add_parser("map-set", help="Tek tesisatı bir Huawei santraline bağla")
    setter.add_argument("--tesisat", required=True)
    setter.add_argument("--plant-code", required=True)
    setter.add_argument("--plant-name")
    setter.add_argument("--notes")

    suggest = sub.add_parser("map-suggest", help="Ada/adrese göre eşleme öner")
    suggest.add_argument("--apply", action="store_true")
    suggest.add_argument("--min-score", type=float, default=0.45)

    sub.add_parser("map-list", help="Kayıtlı eşlemeleri listele")

    compare = sub.add_parser("compare", help="OSOS üretim kWh ile Huawei inverter kWh karşılaştır")
    compare.add_argument("--from", dest="start_date", help="Başlangıç (YYYY-MM-DD)")
    compare.add_argument("--to", dest="end_date", help="Bitiş (YYYY-MM-DD)")
    compare.add_argument("--json", action="store_true")
    return parser


def default_range() -> tuple[str, str]:
    today = datetime.now(TZ).date()
    start = today.replace(day=1)
    return start.isoformat(), today.isoformat()


def make_osos_client(args: argparse.Namespace) -> OsosClient:
    return OsosClient(
        username=require_env("OSOS_USERNAME"),
        password=require_env("OSOS_PASSWORD"),
        base_url=args.base_url,
    )


def make_huawei_client(args: argparse.Namespace) -> HuaweiClient:
    return HuaweiClient(
        username=require_env("HUAWEI_USERNAME"),
        system_code=require_env("HUAWEI_SYSTEM_CODE"),
        base_url=args.huawei_base_url or env("HUAWEI_BASE_URL", HUAWEI_DEFAULT_URL),
    )


def main(argv: list[str] | None = None) -> int:
    load_dotenv()
    parser = build_parser()
    args = parser.parse_args(argv)
    store = OsosStore(args.db)
    try:
        return _run(args, store)
    except OsosError as exc:
        print(f"Hata: {exc}", file=sys.stderr)
        if exc.payload:
            print(json.dumps(exc.payload, ensure_ascii=False, default=str), file=sys.stderr)
        return 1
    except HuaweiError as exc:
        print(f"Hata: {exc}", file=sys.stderr)
        if exc.payload:
            print(json.dumps(exc.payload, ensure_ascii=False, default=str), file=sys.stderr)
        return 1
    except RuntimeError as exc:
        print(f"Hata: {exc}", file=sys.stderr)
        return 1
    finally:
        store.close()


def _run(args: argparse.Namespace, store: OsosStore) -> int:
    if args.command == "status":
        print(json.dumps(store.counts(), ensure_ascii=False, indent=2))
        return 0

    if args.command == "map-list":
        print(json.dumps(store.list_mappings(), ensure_ascii=False, indent=2))
        return 0

    if args.command == "map-export":
        count = export_mapping_csv(
            args.out,
            store.subscriber_dicts(generation_only=args.generation_only),
            store.mapping_by_tesisat(),
        )
        print(json.dumps({"written": count, "path": args.out}, ensure_ascii=False, indent=2))
        return 0

    if args.command == "map-import":
        rows = import_mapping_csv(args.file)
        for row in rows:
            store.upsert_site_mapping(row)
        print(json.dumps({"imported": len(rows)}, ensure_ascii=False, indent=2))
        return 0

    if args.command == "map-set":
        store.upsert_site_mapping(
            {
                "tesisat": args.tesisat,
                "plant_code": args.plant_code,
                "plant_name": args.plant_name,
                "notes": args.notes,
                "match_source": "manual",
            }
        )
        print(json.dumps({"tesisat": args.tesisat, "plant_code": args.plant_code}, ensure_ascii=False, indent=2))
        return 0

    if args.command == "map-suggest":
        suggestions = suggest_mappings(
            store.subscriber_dicts(),
            store.list_huawei_plants(),
            min_score=args.min_score,
        )
        if args.apply:
            for row in suggestions:
                store.upsert_site_mapping(row)
        print(json.dumps({"applied": bool(args.apply), "suggestions": suggestions}, ensure_ascii=False, indent=2))
        return 0

    if args.command == "compare":
        start_date, end_date = default_range()
        start_date = args.start_date or start_date
        end_date = args.end_date or end_date
        result = compare_hourly(
            store.hourly_compare_rows(
                parse_iso_date(start_date, "day"),
                parse_iso_date(end_date, "time"),
            )
        )
        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(
                json.dumps(
                    {
                        "range": [start_date, end_date],
                        "osos_kwh": result["osos_kwh"],
                        "huawei_kwh": result["huawei_kwh"],
                        "delta_kwh": result["delta_kwh"],
                        "missing_huawei_hours": result["missing_huawei_hours"],
                        "row_count": len(result["rows"]),
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
        return 0

    if args.command in {"huawei-login", "huawei-plants", "huawei-sync"}:
        client = make_huawei_client(args)
        if args.command == "huawei-login":
            client.login()
            print(json.dumps({"ok": True, "base_url": args.huawei_base_url}, ensure_ascii=False, indent=2))
            return 0
        if args.command == "huawei-plants":
            client.login()
            plants = client.get_plants()
            store.upsert_huawei_plants(plants)
            print(json.dumps({"plants": plants}, ensure_ascii=False, indent=2, default=str))
            return 0
        start_date, end_date = default_range()
        start_date = args.start_date or start_date
        end_date = args.end_date or end_date
        log_id = store.log_start("huawei-sync")
        try:
            stats = sync_huawei(
                client,
                store,
                start_date=start_date,
                end_date=end_date,
                sleep_s=args.sleep,
                log=print,
            )
            store.log_finish(log_id, "ok", stats)
            print(json.dumps({"range": [start_date, end_date], **stats}, ensure_ascii=False, indent=2))
            return 0
        except Exception as exc:
            store.log_finish(log_id, "error", {"error": str(exc)})
            raise

    client = make_osos_client(args)
    if args.command == "login":
        info = client.login()
        store.upsert_customer(info)
        print(
            json.dumps(
                {
                    "identifier": info.get("IdentifierValue"),
                    "title": (info.get("Properties") or {}).get("100001"),
                    "subscription_count": len(info.get("Subscriptions") or []),
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    if args.command == "subscribers":
        client.login()
        rows = client.get_subscriptions()
        store.upsert_subscribers(rows)
        print(json.dumps({"subscribers": len(rows)}, ensure_ascii=False, indent=2))
        for row in rows:
            print(
                f"{row.get('IdentifierValue')}\t{row.get('MeterBrand')} "
                f"{row.get('MeterSerial')}\t{row.get('Etso')}"
            )
        return 0

    if args.command == "sync":
        start_date, end_date = default_range()
        start_date = args.start_date or start_date
        end_date = args.end_date or end_date
        log_id = store.log_start("sync")
        try:
            stats = sync_all(
                client,
                store,
                start_date=start_date,
                end_date=end_date,
                include_profiles=not args.no_profiles,
                log=print,
            )
            store.log_finish(log_id, "ok", stats)
            print(json.dumps({"range": [start_date, end_date], **stats}, ensure_ascii=False, indent=2))
            return 0
        except Exception as exc:
            store.log_finish(log_id, "error", {"error": str(exc)})
            raise

    raise RuntimeError(f"bilinmeyen komut: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
