from pathlib import Path
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import features

MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_VIDEO_BYTES = 25 * 1024 * 1024
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}


class ImagePrediction(BaseModel):
    result: int = Field(..., description="0 real, 1 fake, -1 no face detected")
    confidence: float = Field(..., ge=0.0, le=1.0)
    confidence_percent: float = Field(..., ge=0.0, le=100.0)
    label: str
    disclaimer: str = "Probabilistic result only; not legal proof."


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "API is running"}


@app.post("/predictVideo")
async def predict_video(video: UploadFile = File(...)):
    if video.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=415, detail="Upload an MP4, WebM, or MOV video.")

    content = await video.read(MAX_VIDEO_BYTES + 1)
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=413, detail="Video exceeds the 25 MB size limit.")

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        prediction = features.video_classifier(str(temp_path))
        return {"result": prediction}
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to process the video.") from exc
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


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

        return ImagePrediction(**features.image_classifier(str(temp_path)))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to process the image.") from exc
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)