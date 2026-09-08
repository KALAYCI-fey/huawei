import json
from email.message import EmailMessage
from io import BytesIO
from urllib.error import HTTPError

from osos.client import OsosClient, OsosError
from osos.crypto import LOGIN_PASSPHRASE, encrypt
from osos.store import OsosStore


class FakeResponse:
    def __init__(self, payload, passphrase=LOGIN_PASSPHRASE):
        self._body = encrypt(payload, passphrase).encode("utf-8")

    def read(self):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class FakeOpener:
    def __init__(self, responses):
        self.responses = list(responses)
        self.requests = []

    def open(self, request, timeout=90):
        self.requests.append(request)
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def test_login_stores_session_key():
    client = OsosClient("user", "secret")
    opener = FakeOpener(
        [
            FakeResponse(
                {
                    "Serno": 1,
                    "IdentifierValue": "demo",
                    "Subscriptions": [{"SubscriptionSerno": 10}],
                    "SessionKey": "abc123",
                    "Properties": {"100001": "Demo Co"},
                }
            )
        ]
    )
    client._opener = opener
    info = client.login()
    assert info["Serno"] == 1
    assert client.session_key == b"abc123"


def test_http_error_surfaces_osos_payload():
    client = OsosClient("user", "secret")
    body = json.dumps({"ExceptionCode": 403, "Message": "denied"}).encode()
    error = HTTPError(
        "https://example.test",
        403,
        "Forbidden",
        EmailMessage(),
        BytesIO(body),
    )
    client._opener = FakeOpener([error])
    try:
        client.login()
        raise AssertionError("expected OsosError")
    except OsosError as exc:
        assert "failed" in str(exc)
        assert exc.status == 403
        assert exc.payload["ExceptionCode"] == 403


def test_store_upserts_subscribers(tmp_path):
    store = OsosStore(tmp_path / "test.db")
    n = store.upsert_subscribers(
        [
            {
                "SubscriptionSerno": 73005,
                "IdentifierValue": "10000032230",
                "DefinitionType": 2,
                "Title": "Test",
                "MeterBrand": "AEL",
                "MeterSerial": "1",
                "Multiplier": 1725,
                "Etso": "40ZTEST",
            }
        ]
    )
    assert n == 1
    rows = store.list_subscribers()
    assert rows[0]["tesisat"] == "10000032230"
    assert store.counts()["subscribers"] == 1
    store.close()
