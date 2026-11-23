from io import BytesIO

from fastapi.testclient import TestClient

import app


client = TestClient(app.app)


def test_home():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "API is running"}


def test_rejects_wrong_content_type():
    response = client.post(
        "/predictImage",
        files={"image": ("notes.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 415


def test_rejects_invalid_magic_bytes():
    response = client.post(
        "/predictImage",
        files={"image": ("fake.jpg", b"not a jpeg", "image/jpeg")},
    )
    assert response.status_code == 415


def test_accepts_valid_png_and_returns_confidence(monkeypatch):
    monkeypatch.setattr(
        app.features,
        "image_classifier",
        lambda _path: {
            "result": 1,
            "confidence": 0.875,
            "confidence_percent": 87.5,
            "label": "Fake",
        },
    )

    png = b"\x89PNG\r\n\x1a\n" + b"small-test-image"
    response = client.post(
        "/predictImage",
        files={"image": ("test.png", BytesIO(png), "image/png")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["label"] == "Fake"
    assert body["confidence"] == 0.875
    assert body["disclaimer"] == "Probabilistic result only; not legal proof."
