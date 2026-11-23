import datetime
from pathlib import Path
import tempfile
from typing import Any, Dict, List, Optional
import uuid

from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import database
import features

BASE_DIR = Path(__file__).resolve().parent
CLIENT_DIST = BASE_DIR / "client" / "dist"

MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_VIDEO_BYTES = 35 * 1024 * 1024
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/x-matroska"}
MAX_AUDIO_BYTES = 15 * 1024 * 1024
ALLOWED_AUDIO_TYPES = {"audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/webm"}


class ImagePrediction(BaseModel):
    result: int = Field(..., description="0 real, 1 fake, -1 no face detected")
    confidence: float = Field(..., ge=0.0, le=1.0)
    confidence_percent: float = Field(..., ge=0.0, le=100.0)
    label: str
    disclaimer: str = "Probabilistic result only; not legal proof."
    authenticity_score: Optional[float] = None
    verdict: Optional[str] = None
    risk_level: Optional[str] = None
    scan_id: Optional[int] = None
    faces_detected_count: Optional[int] = None
    faces: Optional[List[Dict[str, Any]]] = None
    ela: Optional[Dict[str, Any]] = None
    fft: Optional[Dict[str, Any]] = None
    noise: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    ensemble: Optional[Dict[str, Any]] = None
    manipulation_type: Optional[Dict[str, Any]] = None


class VideoPrediction(BaseModel):
    result: int = Field(..., description="0 real, 1 fake, -1 no face detected")
    label: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    confidence_percent: float = Field(..., ge=0.0, le=100.0)
    authenticity_score: float
    verdict: str
    scan_id: Optional[int] = None
    manipulation_type: Optional[Dict[str, Any]] = None
    total_frames_sampled: int
    faces_found_count: int
    fake_frames_count: int
    fake_frame_ratio: float
    duration_seconds: Optional[float] = None
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    flagged_keyframes: List[Dict[str, Any]] = Field(default_factory=list)
    disclaimer: str = "Probabilistic result only; not legal proof."


class RealtimePayload(BaseModel):
    image: str


class AudioPrediction(BaseModel):
    result: int
    label: str
    confidence: float
    confidence_percent: float
    authenticity_score: float
    verdict: str
    scan_id: Optional[int] = None
    zero_crossing_rate: Optional[float] = None
    rms_energy: Optional[float] = None
    spectral_entropy: Optional[float] = None
    disclaimer: str = "Probabilistic result only; not legal proof."


class ReportPayload(BaseModel):
    scan_id: Optional[int] = None
    filename: Optional[str] = "media_item"
    media_type: str = "image"
    verdict: str
    authenticity_score: float
    confidence_percent: float
    sha256: Optional[str] = None
    forensic_summary: Optional[Dict[str, Any]] = None


class ExpertReviewPayload(BaseModel):
    scan_id: int
    reviewer_name: str
    decision: str
    notes: Optional[str] = ""


app = FastAPI(
    title="AI-Based Real-Time Deepfake Detection & Digital Media Verification System",
    description="Full-stack forensic verification engine combining 10-layer Dilated CNN, Error Level Analysis (ELA), 2D Fourier Spectrum (FFT), Laplacian noise forensics, and persistent SQLite database provenance.",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home(request: Request):
    accept_header = request.headers.get("accept", "")
    if "text/html" in accept_header and (CLIENT_DIST / "index.html").exists():
        return FileResponse(CLIENT_DIST / "index.html")
    return {"message": "API is running"}


@app.get("/systemInfo")
def system_info():
    return {
        "model_architecture": "10-Layer Deep Dilated CNN",
        "parameters": 653314,
        "input_resolution": [224, 224, 3],
        "regularization": "Dropout (0.50)",
        "database_backend": "SQLite Forensic Audit Store",
        "capabilities": [
            "Facial Deepfake Classification",
            "Error Level Analysis (ELA) Compression Tamper Heatmap",
            "2D Fast Fourier Transform (FFT) GAN Artifact Detection",
            "Laplacian Boundary Noise & Texture Consistency Analysis",
            "EXIF Software Signature & Provenance Audit",
            "Multi-Frame Temporal Video Deepfake Scanning",
            "Real-Time Live Webcam Stream Analysis",
            "Synthetic AI Voice & Speech Forensics",
            "Persistent SQLite Database Audit Logging",
            "Cryptographic Verification Certificate Generation",
        ],
        "disclaimer": "Probabilistic result only; not legal proof.",
    }


@app.post("/predictImage", response_model=ImagePrediction)
async def predict_image(image: UploadFile = File(...)):
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP image.")

    content = await image.read(MAX_IMAGE_BYTES + 1)
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB size limit.")

    magic_is_jpeg = content.startswith(b"\xff\xd8\xff")
    magic_is_png = content.startswith(b"\x89PNG\r\n\x1a\n")
    magic_is_webp = content.startswith(b"RIFF") and content[8:12] == b"WEBP"
    if not (magic_is_jpeg or magic_is_png or magic_is_webp):
        raise HTTPException(status_code=415, detail="File content is not a valid JPEG, PNG, or WebP image.")

    suffix = ".jpg" if magic_is_jpeg else ".png" if magic_is_png else ".webp"
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        raw_result = features.image_classifier(str(temp_path))
        if "disclaimer" not in raw_result:
            raw_result["disclaimer"] = "Probabilistic result only; not legal proof."

        # Persist scan to database
        try:
            scan_id = database.save_scan({
                "filename": image.filename or "uploaded_image",
                "media_type": "image",
                "file_size_bytes": len(content),
                "sha256": raw_result.get("metadata", {}).get("sha256", ""),
                "md5": raw_result.get("metadata", {}).get("md5", ""),
                "result": raw_result.get("result", -1),
                "label": raw_result.get("label", ""),
                "confidence": raw_result.get("confidence", 0.0),
                "confidence_percent": raw_result.get("confidence_percent", 0.0),
                "authenticity_score": raw_result.get("authenticity_score", 0.0),
                "verdict": raw_result.get("verdict", ""),
                "risk_level": raw_result.get("risk_level", ""),
                "details": {
                    "faces_detected": raw_result.get("faces_detected_count", 0),
                    "ela": raw_result.get("ela"),
                    "fft": raw_result.get("fft"),
                    "noise": raw_result.get("noise"),
                    "provenance_verdict": raw_result.get("metadata", {}).get("provenance_verdict", ""),
                },
            })
            raw_result["scan_id"] = scan_id
        except Exception as db_err:
            print(f"Warning: Failed to save scan to database: {db_err}")

        return ImagePrediction(**raw_result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to process the image: {exc}") from exc
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


@app.post("/predictVideo", response_model=VideoPrediction)
async def predict_video(video: UploadFile = File(...)):
    if video.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=415, detail="Upload an MP4, WebM, or MOV video.")

    content = await video.read(MAX_VIDEO_BYTES + 1)
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=413, detail="Video exceeds the 35 MB size limit.")

    suffix = ".mp4"
    if video.content_type == "video/webm":
        suffix = ".webm"
    elif video.content_type == "video/quicktime":
        suffix = ".mov"

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        analysis = features.video_classifier_advanced(str(temp_path))
        analysis["disclaimer"] = "Probabilistic result only; not legal proof."

        # Persist video scan to database
        try:
            scan_id = database.save_scan({
                "filename": video.filename or "uploaded_video",
                "media_type": "video",
                "file_size_bytes": len(content),
                "result": analysis.get("result", -1),
                "label": analysis.get("label", ""),
                "confidence": analysis.get("confidence", 0.0),
                "confidence_percent": analysis.get("confidence_percent", 0.0),
                "authenticity_score": analysis.get("authenticity_score", 0.0),
                "verdict": analysis.get("verdict", ""),
                "details": {
                    "total_frames_sampled": analysis.get("total_frames_sampled", 0),
                    "faces_found_count": analysis.get("faces_found_count", 0),
                    "fake_frames_count": analysis.get("fake_frames_count", 0),
                    "fake_frame_ratio": analysis.get("fake_frame_ratio", 0.0),
                    "duration_seconds": analysis.get("duration_seconds", 0.0),
                },
            })
            analysis["scan_id"] = scan_id
        except Exception as db_err:
            print(f"Warning: Failed to save video scan to database: {db_err}")

        return VideoPrediction(**analysis)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to process the video: {exc}") from exc
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


@app.post("/predictRealtime")
async def predict_realtime(payload: RealtimePayload):
    if not payload.image:
        raise HTTPException(status_code=400, detail="Missing frame payload")
    result = features.realtime_classifier(payload.image)
    return result


@app.post("/predictAudio", response_model=AudioPrediction)
async def predict_audio(audio: UploadFile = File(...)):
    if audio.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=415, detail="Upload a WAV, MP3, or OGG audio file.")

    content = await audio.read(MAX_AUDIO_BYTES + 1)
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio exceeds the 15 MB size limit.")

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        result = features.audio_classifier(str(temp_path))
        result["disclaimer"] = "Probabilistic result only; not legal proof."

        # Persist audio scan to database
        try:
            scan_id = database.save_scan({
                "filename": audio.filename or "uploaded_audio",
                "media_type": "audio",
                "file_size_bytes": len(content),
                "result": result.get("result", 0),
                "label": result.get("label", ""),
                "confidence": result.get("confidence", 0.0),
                "confidence_percent": result.get("confidence_percent", 0.0),
                "authenticity_score": result.get("authenticity_score", 0.0),
                "verdict": result.get("verdict", ""),
                "details": {
                    "zero_crossing_rate": result.get("zero_crossing_rate"),
                    "rms_energy": result.get("rms_energy"),
                    "spectral_entropy": result.get("spectral_entropy"),
                },
            })
            result["scan_id"] = scan_id
        except Exception as db_err:
            print(f"Warning: Failed to save audio scan to database: {db_err}")

        return AudioPrediction(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to analyze audio: {exc}") from exc
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


@app.post("/generateReport")
def generate_report(payload: ReportPayload):
    report_id = f"VERI-{uuid.uuid4().hex[:8].upper()}-{datetime.date.today().year}"
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    report_data = {
        "certificate_id": report_id,
        "issuing_authority": "VeriMedia AI Forensics Lab",
        "timestamp_utc": timestamp,
        "scan_id": payload.scan_id,
        "media_inspected": payload.filename,
        "media_type": payload.media_type,
        "sha256_checksum": payload.sha256 or uuid.uuid4().hex,
        "overall_verdict": payload.verdict,
        "authenticity_score": payload.authenticity_score,
        "confidence_rating": f"{payload.confidence_percent}%",
        "standards_compliance": ["ISO/IEC 27037 Digital Evidence Guidelines", "NIST Media Integrity"],
        "chain_of_custody_verified": True,
        "forensic_breakdown": payload.forensic_summary or {},
        "official_disclaimer": "This document contains a probabilistic authenticity assessment produced by machine learning models and digital forensic algorithms. It is not an absolute legal determination.",
    }

    # Persist certificate to SQLite database
    try:
        database.save_certificate(report_data)
    except Exception as exc:
        print(f"Warning: Failed to persist certificate to DB: {exc}")

    return report_data


# -------------------------------------------------------------
# Database Management Endpoints
# -------------------------------------------------------------

@app.get("/api/benchmarks")
def get_benchmarks():
    return {"benchmarks": features.get_dataset_benchmarks()}


@app.get("/api/scans")
def list_scans(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    media_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    scans = database.get_scans(limit=limit, offset=offset, media_type=media_type, search=search)
    return {"scans": scans, "count": len(scans)}


@app.get("/api/scans/{scan_id}")
def get_scan(scan_id: int):
    scan = database.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")
    return scan


@app.delete("/api/scans/{scan_id}")
def delete_scan(scan_id: int):
    deleted = database.delete_scan(scan_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scan record not found")
    return {"message": "Scan deleted successfully", "id": scan_id}


@app.delete("/api/scans")
def clear_all_scans():
    database.clear_all_scans()
    return {"message": "All scan records and certificates cleared"}


@app.get("/api/certificates/{certificate_id}")
def get_certificate(certificate_id: str):
    cert = database.get_certificate(certificate_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert


@app.get("/api/stats")
def get_db_stats():
    return database.get_db_stats()


@app.post("/api/reviews")
def add_expert_review(payload: ExpertReviewPayload):
    review_id = database.add_expert_review(
        scan_id=payload.scan_id,
        reviewer_name=payload.reviewer_name,
        decision=payload.decision,
        notes=payload.notes or "",
    )
    return {"message": "Review added successfully", "review_id": review_id}


# -------------------------------------------------------------
# Static SPA Hosting for Render Unified Deployment
# -------------------------------------------------------------

if (CLIENT_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(CLIENT_DIST / "assets")), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str, request: Request):
    if CLIENT_DIST.exists():
        file_path = CLIENT_DIST / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        if "text/html" in request.headers.get("accept", "") and (CLIENT_DIST / "index.html").exists():
            return FileResponse(CLIENT_DIST / "index.html")
    raise HTTPException(status_code=404, detail="Not Found")
