"""Date helpers for ARiL long timestamps (YYYYMMDDHHMMSS integers)."""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Europe/Istanbul")


def date_to_long(dt: datetime, zoom: str = "day") -> int:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TZ)
    else:
        dt = dt.astimezone(TZ)
    year = f"{dt.year:04d}"
    month = f"{dt.month:02d}"
    day = f"{dt.day:02d}"
    hour = f"{dt.hour:02d}"
    minute = f"{dt.minute:02d}"
    second = f"{dt.second:02d}"
    if zoom == "time":
        value = year + month + day + hour + minute + second
    elif zoom == "minute":
        value = year + month + day + hour + minute + "00"
    elif zoom == "hour":
        value = year + month + day + hour + "0000"
    elif zoom == "day":
        value = year + month + day + "000000"
    elif zoom == "month":
        value = year + month + "01000000"
    elif zoom == "year":
        value = year + "0101000000"
    else:
        raise ValueError(f"invalid zoom: {zoom}")
    return int(value)


def long_to_datetime(value: int | str | None) -> datetime | None:
    if value in (None, "", 0):
        return None
    text = str(int(value)).ljust(14, "0")[:14]
    return datetime.strptime(text, "%Y%m%d%H%M%S").replace(tzinfo=TZ)


def datetime_to_millis(dt: datetime) -> int:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TZ)
    return int(dt.timestamp() * 1000)


def millis_to_datetime(value: int | float) -> datetime:
    return datetime.fromtimestamp(int(value) / 1000, tz=TZ)


def millis_to_long(value: int | float, zoom: str = "hour") -> int:
    return date_to_long(millis_to_datetime(value), zoom)


def parse_iso_date(value: str, zoom: str = "day") -> int:
    """Parse YYYY-MM-DD or YYYY-MM-DDTHH:MM into an ARiL long timestamp."""
    text = value.strip()
    if "T" in text:
        dt = datetime.fromisoformat(text)
        if zoom == "day":
            zoom = "time"
    else:
        dt = datetime.strptime(text, "%Y-%m-%d")
        if zoom == "time":
            dt = dt.replace(hour=23, minute=59, second=59)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TZ)
    return date_to_long(dt, zoom)
