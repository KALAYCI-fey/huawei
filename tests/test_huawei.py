import json
from email.message import EmailMessage
from io import BytesIO
from unittest.mock import patch
from urllib.error import HTTPError

from osos.huawei_client import HuaweiClient, HuaweiError


class FakeResponse:
    def __init__(self, payload, headers=None):
        self._body = json.dumps(payload).encode("utf-8")
        self.headers = headers or {}

    def read(self):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def test_login_reads_xsrf_token():
    client = HuaweiClient("api-user", "secret", base_url="https://eu5.example.test")
    response = FakeResponse({"failCode": 0, "success": True}, {"xsrf-token": "tok-1"})
    with patch("osos.huawei_client.urlopen", return_value=response):
        client.login()
    assert client.token == "tok-1"


def test_login_failure():
    client = HuaweiClient("api-user", "secret", base_url="https://eu5.example.test")
    response = FakeResponse({"failCode": 20009, "message": "denied"})
    with patch("osos.huawei_client.urlopen", return_value=response):
        try:
            client.login()
            raise AssertionError("expected HuaweiError")
        except HuaweiError as exc:
            assert exc.fail_code == 20009


def test_get_plants_normalizes_station_list():
    client = HuaweiClient("api-user", "secret", base_url="https://eu5.example.test")
    client.token = "tok-1"
    stations = FakeResponse(
        {
            "failCode": 0,
            "data": {
                "list": [{"plantCode": "NE=111", "plantName": "Afyon GES", "capacity": 750}],
                "pageCount": 1,
            },
        }
    )
    with patch("osos.huawei_client.urlopen", return_value=stations):
        plants = client.get_plants()
    assert plants[0]["plant_code"] == "NE=111"
    assert plants[0]["plant_name"] == "Afyon GES"


def test_http_error():
    client = HuaweiClient("api-user", "secret", base_url="https://eu5.example.test")
    error = HTTPError(
        "https://eu5.example.test/thirdData/login",
        401,
        "Unauthorized",
        EmailMessage(),
        BytesIO(b'{"failCode":401}'),
    )
    with patch("osos.huawei_client.urlopen", side_effect=error):
        try:
            client.login()
            raise AssertionError("expected HuaweiError")
        except HuaweiError as exc:
            assert exc.fail_code == 401
