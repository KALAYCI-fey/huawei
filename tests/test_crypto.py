from osos.crypto import LOGIN_PASSPHRASE, decrypt, encrypt
from osos.dates import date_to_long, long_to_datetime, parse_iso_date


def test_encrypt_decrypt_roundtrip():
    payload = {"UserCode": "demo", "LoginType": 1, "nested": {"ok": True}}
    blob = encrypt(payload, LOGIN_PASSPHRASE)
    assert blob[:32].isalnum()
    assert decrypt(blob, LOGIN_PASSPHRASE) == payload


def test_session_key_roundtrip():
    session = b"test-session-key-value-not-real"
    payload = {"MethodName": "GetCustomerPortalSubscriptions", "Parameters": {"Serno": 1}}
    assert decrypt(encrypt(payload, session), session) == payload


def test_date_to_long_day_and_month():
    dt = long_to_datetime(20260908000000)
    assert dt is not None
    assert date_to_long(dt, "day") == 20260908000000
    assert date_to_long(dt, "month") == 20260901000000


def test_parse_iso_inclusive_end():
    assert parse_iso_date("2026-09-08", "day") == 20260908000000
    assert parse_iso_date("2026-09-08", "time") == 20260908235959
