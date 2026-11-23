import base64
from io import BytesIO

from fastapi.testclient import TestClient

import app


client = TestClient(app.app)


def test_home():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "API is running"}


def test_system_info():
    response = client.get("/systemInfo")
    assert response.status_code == 200
    data = response.json()
    assert "10-Layer Deep Dilated CNN" in data["model_architecture"]
    assert data["parameters"] == 653314


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
            "authenticity_score": 12.5,
            "verdict": "Manipulated / Deepfake Detected",
            "risk_level": "High",
            "faces_detected_count": 1,
            "faces": [],
            "ela": {"tamper_score": 45.0, "tamper_detected": False},
            "fft": {"anomaly_score": 52.0},
            "noise": {"overall_sharpness": 120.0},
            "metadata": {"sha256": "abc123"},
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
    assert body["authenticity_score"] == 12.5
    assert body["verdict"] == "Manipulated / Deepfake Detected"
    assert body["disclaimer"] == "Probabilistic result only; not legal proof."


def test_predict_video_endpoint(monkeypatch):
    monkeypatch.setattr(
        app.features,
        "video_classifier_advanced",
        lambda _path: {
            "result": 1,
            "label": "Fake",
            "confidence": 0.92,
            "confidence_percent": 92.0,
            "authenticity_score": 8.0,
            "verdict": "Deepfake Video Detected",
            "total_frames_sampled": 20,
            "faces_found_count": 18,
            "fake_frames_count": 15,
            "fake_frame_ratio": 83.33,
            "duration_seconds": 4.5,
            "timeline": [],
            "flagged_keyframes": [],
        },
    )

    fake_mp4 = b"ftypmp42" + b"\x00" * 100
    response = client.post(
        "/predictVideo",
        files={"video": ("sample.mp4", BytesIO(fake_mp4), "video/mp4")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["result"] == 1
    assert data["label"] == "Fake"
    assert data["authenticity_score"] == 8.0
    assert data["fake_frames_count"] == 15


def test_predict_realtime_endpoint(monkeypatch):
    monkeypatch.setattr(
        app.features,
        "realtime_classifier",
        lambda _img: {
            "result": 0,
            "confidence": 0.98,
            "confidence_percent": 98.0,
            "label": "Real",
            "box": [50, 50, 120, 120],
        },
    )

    response = client.post(
        "/predictRealtime",
        json={"image": "data:image/jpeg;base64,1234"},
    )
    assert response.status_code == 200
    res = response.json()
    assert res["label"] == "Real"
    assert res["confidence_percent"] == 98.0


def test_predict_audio_endpoint(monkeypatch):
    monkeypatch.setattr(
        app.features,
        "audio_classifier",
        lambda _path: {
            "result": 0,
            "label": "Natural Human Voice",
            "confidence": 0.91,
            "confidence_percent": 91.0,
            "authenticity_score": 91.0,
            "verdict": "Organic Human Speech",
            "zero_crossing_rate": 0.08,
            "rms_energy": 0.12,
            "spectral_entropy": 7.8,
        },
    )

    dummy_wav = b"RIFF" + b"\x00" * 100
    response = client.post(
        "/predictAudio",
        files={"audio": ("sample.wav", BytesIO(dummy_wav), "audio/wav")},
    )
    assert response.status_code == 200
    res = response.json()
    assert res["label"] == "Natural Human Voice"
    assert res["authenticity_score"] == 91.0


def test_generate_report_endpoint():
    response = client.post(
        "/generateReport",
        json={
            "filename": "suspect_photo.jpg",
            "media_type": "image",
            "verdict": "Manipulated / Deepfake Detected",
            "authenticity_score": 15.5,
            "confidence_percent": 84.5,
            "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "forensic_summary": {"tamper_detected": True},
        },
    )
    assert response.status_code == 200
    report = response.json()
    assert "certificate_id" in report
    assert report["certificate_id"].startswith("VERI-")
    assert report["authenticity_score"] == 15.5
    assert report["overall_verdict"] == "Manipulated / Deepfake Detected"
    assert report["chain_of_custody_verified"] is True


def test_benchmarks_endpoint():
    response = client.get("/api/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert "benchmarks" in data
    assert len(data["benchmarks"]) >= 5
    ids = [b["id"] for b in data["benchmarks"]]
    assert "faceforensics" in ids
    assert "celeb-df" in ids
    assert "dfdc" in ids


def test_database_scans_and_stats():
    # Insert a test scan via database module
    app.database.save_scan({
        "filename": "unit_test_sample.png",
        "media_type": "image",
        "result": 1,
        "label": "Fake",
        "confidence_percent": 94.5,
        "authenticity_score": 5.5,
        "verdict": "Deepfake Detected",
        "sha256": "1122334455667788",
    })

    # Retrieve via API
    res = client.get("/api/scans?limit=10")
    assert res.status_code == 200
    scans_data = res.json()
    assert "scans" in scans_data
    assert len(scans_data["scans"]) > 0

    # Retrieve stats
    stats_res = client.get("/api/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_scans" in stats
    assert stats["total_scans"] > 0
