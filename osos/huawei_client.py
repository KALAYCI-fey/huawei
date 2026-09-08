"""Huawei FusionSolar Northbound API client."""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from osos.dates import datetime_to_millis, parse_iso_date, long_to_datetime

DEFAULT_BASE_URL = "https://eu5.fusionsolar.huawei.com"


class HuaweiError(RuntimeError):
    def __init__(self, message: str, fail_code: int | None = None, payload: Any = None):
        super().__init__(message)
        self.fail_code = fail_code
        self.payload = payload


class HuaweiClient:
    def __init__(
        self,
        username: str,
        system_code: str,
        base_url: str = DEFAULT_BASE_URL,
    ) -> None:
        self.username = username
        self.system_code = system_code
        self.base_url = base_url.rstrip("/")
        self.token: str | None = None

    def login(self) -> dict[str, Any]:
        payload = {"userName": self.username, "systemCode": self.system_code}
        data, headers = self._post("/thirdData/login", payload, with_token=False)
        token = headers.get("xsrf-token") or headers.get("XSRF-TOKEN")
        if not token:
            set_cookie = headers.get("Set-Cookie") or ""
            for part in set_cookie.split(";"):
                if "xsrf-token=" in part.lower():
                    token = part.split("=", 1)[-1].strip()
        fail_code = data.get("failCode")
        if fail_code not in (0, None, 305) or not token:
            raise HuaweiError(
                f"FusionSolar girişi başarısız (failCode={fail_code}): {data.get('message')}",
                fail_code=fail_code,
                payload=data,
            )
        self.token = token
        return data

    def ensure_login(self) -> None:
        if not self.token:
            self.login()

    def get_plants(self) -> list[dict[str, Any]]:
        self.ensure_login()
        plants: list[dict[str, Any]] = []
        try:
            page = 1
            while True:
                data = self._api_json("/thirdData/stations", {"pageNo": page})
                block = data.get("data") or {}
                if isinstance(block, list):
                    plants.extend(_normalize_plants(block))
                    break
                rows = block.get("list") or []
                plants.extend(_normalize_plants(rows))
                total_pages = int(block.get("pageCount") or page)
                if page >= total_pages or not rows:
                    break
                page += 1
        except HuaweiError:
            data = self._api_json("/thirdData/getStationList", {})
            rows = data.get("data") or []
            if isinstance(rows, dict):
                rows = rows.get("list") or rows.get("data") or []
            plants = _normalize_plants(rows)
        return plants

    def get_realtime(self, plant_codes: list[str]) -> list[dict[str, Any]]:
        self.ensure_login()
        data = self._api_json(
            "/thirdData/getStationRealKpi",
            {"stationCodes": ",".join(plant_codes)},
        )
        return list(data.get("data") or [])

    def get_hourly(self, plant_codes: list[str], day: str | int) -> list[dict[str, Any]]:
        self.ensure_login()
        collect = _collect_time(day, "day")
        data = self._api_json(
            "/thirdData/getKpiStationHour",
            {"stationCodes": ",".join(plant_codes), "collectTime": collect},
        )
        return list(data.get("data") or [])

    def get_daily(self, plant_codes: list[str], month: str | int) -> list[dict[str, Any]]:
        self.ensure_login()
        collect = _collect_time(month, "month")
        data = self._api_json(
            "/thirdData/getKpiStationDay",
            {"stationCodes": ",".join(plant_codes), "collectTime": collect},
        )
        return list(data.get("data") or [])

    def _api_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        data, _headers = self._post(path, payload, with_token=True)
        fail_code = data.get("failCode")
        if fail_code not in (0, None):
            raise HuaweiError(
                f"FusionSolar {path} hata (failCode={fail_code}): {data.get('message')}",
                fail_code=fail_code,
                payload=data,
            )
        return data

    def _post(
        self,
        path: str,
        payload: dict[str, Any],
        with_token: bool,
    ) -> tuple[dict[str, Any], Any]:
        url = f"{self.base_url}{path}"
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "osos-sync/1.0",
        }
        if with_token:
            if not self.token:
                raise HuaweiError("FusionSolar token yok; önce login çağırın")
            headers["XSRF-TOKEN"] = self.token
        request = Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers=headers,
        )
        try:
            with urlopen(request, timeout=60) as response:
                raw = response.read().decode("utf-8")
                headers_out = response.headers
        except HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace")
            try:
                payload_out = json.loads(raw) if raw else {"status": exc.code}
            except json.JSONDecodeError:
                payload_out = {"status": exc.code, "body": raw}
            raise HuaweiError(
                f"FusionSolar HTTP {exc.code}: {path}",
                fail_code=exc.code,
                payload=payload_out,
            ) from exc
        except URLError as exc:
            raise HuaweiError(f"FusionSolar ağ hatası: {exc.reason}") from exc
        try:
            data = json.loads(raw) if raw else {}
        except json.JSONDecodeError as exc:
            raise HuaweiError(f"FusionSolar JSON değil: {raw[:200]}") from exc
        return data, headers_out


def _normalize_plants(rows: list[Any]) -> list[dict[str, Any]]:
    plants = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        plants.append(
            {
                "plant_code": row.get("plantCode") or row.get("stationCode"),
                "plant_name": row.get("plantName") or row.get("stationName"),
                "plant_address": row.get("plantAddress") or row.get("stationAddr"),
                "capacity": row.get("capacity") or row.get("installedCapacity"),
                "longitude": row.get("longitude"),
                "latitude": row.get("latitude"),
                "grid_connection_date": row.get("gridConnectionDate"),
                "raw": row,
            }
        )
    return [p for p in plants if p.get("plant_code")]


def _collect_time(value: str | int, zoom: str) -> int:
    if isinstance(value, int) and value > 10_000_000_000:
        return value
    if isinstance(value, int):
        dt = long_to_datetime(value)
        if dt is None:
            raise HuaweiError(f"geçersiz collectTime: {value}")
        return datetime_to_millis(dt)
    text = str(value)
    if text.isdigit() and len(text) >= 13:
        return int(text)
    long_value = parse_iso_date(text, zoom)
    dt = long_to_datetime(long_value)
    assert dt is not None
    return datetime_to_millis(dt)


def iter_days(start_date: str, end_date: str) -> list[str]:
    start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=TZ)
    end = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=TZ)
    if end < start:
        raise ValueError("bitiş tarihi başlangıçtan küçük")
    days = []
    current = start
    while current <= end:
        days.append(current.date().isoformat())
        current += timedelta(days=1)
    return days
