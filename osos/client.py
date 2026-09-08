"""HTTP client for the OEDAŞ ARiL customer portal ESB."""

from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import HTTPCookieProcessor, Request, build_opener
from http.cookiejar import CookieJar

from osos.crypto import LOGIN_PASSPHRASE, decrypt, encrypt
from osos.dates import parse_iso_date

DEFAULT_BASE_URL = "https://ososout.oedas.com.tr"
LOGIN_TYPE_CUSTOMER_PORTAL = 1
LOGIN_PHASE_TOKEN_GENERATE = 1
APPLICATION_PORTAL = "PORTAL"

DEFINITION_TYPES = {
    2: "Subscriber",
    11: "Lighting",
    15: "GenerationPlant",
}

ENDEX_DIRECTION_IN = 0
ENDEX_DIRECTION_OUT = 1


class OsosError(RuntimeError):
    def __init__(self, message: str, status: int | None = None, payload: Any = None):
        super().__init__(message)
        self.status = status
        self.payload = payload


class OsosClient:
    def __init__(
        self,
        username: str,
        password: str,
        base_url: str = DEFAULT_BASE_URL,
    ) -> None:
        self.username = username
        self.password = password
        self.base_url = base_url.rstrip("/")
        self._opener = build_opener(HTTPCookieProcessor(CookieJar()))
        self.session_key: bytes | None = None
        self.customer: dict[str, Any] | None = None

    @property
    def api_root(self) -> str:
        return f"{self.base_url}/aril-portalserver/api"

    def login(self) -> dict[str, Any]:
        payload = {
            "UserCode": self.username,
            "Password": self.password,
            "LoginType": LOGIN_TYPE_CUSTOMER_PORTAL,
            "RememberMe": False,
            "LoginPhase": LOGIN_PHASE_TOKEN_GENERATE,
        }
        data = self._post(f"{self.api_root}/login", payload, LOGIN_PASSPHRASE)
        session_key = data.get("SessionKey")
        if not session_key:
            raise OsosError("Login succeeded but SessionKey is missing", payload=data)
        self.session_key = session_key.encode("utf-8")
        self.customer = data
        return data

    def ensure_login(self) -> dict[str, Any]:
        if self.session_key is None or self.customer is None:
            return self.login()
        return self.customer

    def customer_serno(self) -> int:
        info = self.ensure_login()
        return int(info["Serno"])

    def call(self, method: str, params: dict[str, Any] | None = None) -> Any:
        self.ensure_login()
        assert self.session_key is not None
        body = {
            "MethodName": method,
            "Parameters": params or {},
            "IsAsync": False,
            "Application": APPLICATION_PORTAL,
        }
        return self._post(f"{self.api_root}/customer-esb", body, self.session_key)

    def get_subscriptions(
        self,
        mark_filter: str | None = None,
        title_filter: str | None = None,
    ) -> list[dict[str, Any]]:
        result = self.call(
            "GetCustomerPortalSubscriptions",
            {
                "Serno": self.customer_serno(),
                "MarkFilterString": mark_filter,
                "TitleFilterString": title_filter,
            },
        )
        return list(result.get("ResultList") or [])

    def get_definition(self, serno: int, definition_type: int) -> dict[str, Any]:
        return self.call(
            "GetDefinitionBySernoParam",
            {
                "Serno": serno,
                "DefinitionType": definition_type,
                "IncludeGroupInfo": False,
            },
        )

    def get_monthly_endex(
        self,
        owner_serno: int,
        end_date: str | int,
        direction: int = ENDEX_DIRECTION_IN,
        owner_identifier: str | None = None,
        owner_identifier_sec: str | None = None,
    ) -> list[dict[str, Any]]:
        end_long = _as_long(end_date, "month")
        result = self.call(
            "GetOwnerMontlyEndexConsumptions",
            {
                "OwnerSerno": owner_serno,
                "OwnerIdentifier": owner_identifier,
                "OwnerIdentifierSec": owner_identifier_sec,
                "EndDate": end_long,
                "WithoutMultiplied": False,
                "EndexDirection": direction,
            },
        )
        if isinstance(result, list):
            return result
        return list(result.get("ResultList") or [])

    def get_consumptions(
        self,
        owner_serno: int,
        owner_type: int,
        start_date: str | int,
        end_date: str | int,
        include_load_profiles: bool = False,
    ) -> dict[str, Any]:
        return self.call(
            "GetOwnerConsumptions",
            {
                "OwnerSerno": owner_serno,
                "OwnerType": owner_type,
                "StartDate": _as_long(start_date, "day"),
                "EndDate": _as_long(end_date, "time"),
                "IsOnlySuccess": True,
                "IncludeLoadProfiles": include_load_profiles,
                "IncludeVersions": False,
                "WithoutMultiplier": False,
                "MergeResult": True,
            },
        )

    def get_load_profiles(
        self,
        owner_serno: int,
        start_date: str | int,
        end_date: str | int,
        page_size: int = 2000,
    ) -> list[dict[str, Any]]:
        page = 1
        items: list[dict[str, Any]] = []
        while True:
            result = self.call(
                "GetOwnerLoadProfiles",
                {
                    "OwnerSerno": owner_serno,
                    "StartDate": _as_long(start_date, "day"),
                    "EndDate": _as_long(end_date, "time"),
                    "PageNumber": page,
                    "PageSize": page_size,
                },
            )
            batch = list(result.get("ResultList") or [])
            items.extend(batch)
            total = int(result.get("TotalItemCount") or 0)
            if not batch or len(items) >= total:
                break
            page += 1
        return items

    def get_current_endexes(
        self,
        owner_serno: int,
        start_date: str | int,
        end_date: str | int,
        direction: int = ENDEX_DIRECTION_IN,
        page_size: int = 500,
    ) -> list[dict[str, Any]]:
        result = self.call(
            "GetCurrentEndexes",
            {
                "OwnerSerno": owner_serno,
                "StartDate": _as_long(start_date, "day"),
                "EndDate": _as_long(end_date, "time"),
                "EndexDirection": direction,
                "PageNumber": 1,
                "PageSize": page_size,
            },
        )
        return list(result.get("ResultList") or [])

    def _post(self, url: str, payload: dict[str, Any], passphrase: bytes) -> Any:
        body = encrypt(payload, passphrase).encode("utf-8")
        request = Request(
            url,
            data=body,
            method="POST",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; osos-sync/1.0)",
                "Origin": self.base_url,
                "Referer": f"{self.base_url}/",
            },
        )
        try:
            with self._opener.open(request, timeout=90) as response:
                raw = response.read().decode("utf-8")
        except HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace")
            detail: Any
            try:
                detail = json.loads(raw)
            except json.JSONDecodeError:
                try:
                    detail = decrypt(raw, passphrase)
                except Exception:
                    detail = raw
            raise OsosError(
                f"OSOS request failed ({exc.code}): {url}",
                status=exc.code,
                payload=detail,
            ) from exc
        except URLError as exc:
            raise OsosError(f"OSOS network error: {exc.reason}") from exc
        return decrypt(raw, passphrase)


def _as_long(value: str | int, zoom: str) -> int:
    if isinstance(value, int):
        return value
    if value.isdigit():
        return int(value)
    if zoom == "day" and "T" not in value:
        return parse_iso_date(value, "day")
    if zoom == "month":
        return parse_iso_date(value, "month")
    return parse_iso_date(value, zoom)
