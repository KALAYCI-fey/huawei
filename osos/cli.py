"""Command-line interface for OEDAŞ OSOS data import."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from osos.client import OsosClient, OsosError
from osos.config import load_dotenv, require_env
from osos.store import OsosStore
from osos.sync import sync_all

TZ = ZoneInfo("Europe/Istanbul")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="OEDAŞ OSOS müşteri portalından veri çekip yerel SQLite deposuna yazar."
    )
    parser.add_argument("--db", default=os.environ.get("OSOS_DB_PATH", "data/osos.db"))
    parser.add_argument(
        "--base-url",
        default=os.environ.get("OSOS_BASE_URL", "https://ososout.oedas.com.tr"),
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("login", help="Kimlik bilgilerini doğrula")
    sub.add_parser("subscribers", help="Abone/tesisat listesini senkronize et")
    sub.add_parser("status", help="Yerel depodaki kayıt sayılarını göster")

    sync = sub.add_parser("sync", help="Abone, endeks, tüketim ve yük profili çek")
    sync.add_argument("--from", dest="start_date", help="Başlangıç (YYYY-MM-DD)")
    sync.add_argument("--to", dest="end_date", help="Bitiş (YYYY-MM-DD)")
    sync.add_argument(
        "--no-profiles",
        action="store_true",
        help="15 dakikalık yük profili çekme",
    )
    return parser


def default_range() -> tuple[str, str]:
    today = datetime.now(TZ).date()
    start = today.replace(day=1)
    return start.isoformat(), (today + timedelta(days=1)).isoformat()


def make_client(args: argparse.Namespace) -> OsosClient:
    return OsosClient(
        username=require_env("OSOS_USERNAME"),
        password=require_env("OSOS_PASSWORD"),
        base_url=args.base_url,
    )


def main(argv: list[str] | None = None) -> int:
    load_dotenv()
    parser = build_parser()
    args = parser.parse_args(argv)
    store = OsosStore(args.db)
    try:
        if args.command == "status":
            print(json.dumps(store.counts(), ensure_ascii=False, indent=2))
            return 0

        client = make_client(args)
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
    except OsosError as exc:
        print(f"Hata: {exc}", file=sys.stderr)
        if exc.payload:
            print(json.dumps(exc.payload, ensure_ascii=False, default=str), file=sys.stderr)
        return 1
    except RuntimeError as exc:
        print(f"Hata: {exc}", file=sys.stderr)
        return 1
    finally:
        store.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
