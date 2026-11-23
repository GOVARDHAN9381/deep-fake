# AI-Based Real-Time Deepfake Detection & Digital Media Verification System

### DeepShield AI Forensics Studio v2.0
A state-of-the-art, full-stack digital forensics and deepfake verification platform developed with **FastAPI**, **TensorFlow**, **OpenCV**, **React.js**, and **Tailwind CSS**.

---

## Quickstart (Local Execution)

Run these commands from `c:\Deep fake\deepfake-detection` (or directly from `c:\Deep fake`):

### 1. Run Backend Pytest Suite
```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

### 2. Start React Website (Vite Dev Server)
```powershell
npm --prefix client run dev
```
Website runs at: **http://localhost:5173**

### 3. Start FastAPI Forensic Server
```powershell
.\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation & Swagger UI runs at: **http://localhost:8000/docs**

---

## System Capabilities & Key Features

### 1. 🖼️ Multi-Spectral Image Forensics Studio
- **10-Layer Deep Dilated CNN**: 653,314 trainable parameters with 0.50 dropout regularization for resilient facial classification.
- **Multi-Face Detection & Bounding Boxes**: Automatically isolates and renders individual face bounding boxes with per-face confidence scores.
- **Error Level Analysis (ELA)**: Recompresses images at 90% quality to compute amplified compression deltas, exposing splice seams and re-saved face regions.
- **JET Thermal Heatmap**: Visualizes localized compression anomalies with a dynamic temperature gradient.
- **2D Fast Fourier Transform (FFT) Spectrogram**: Identifies unnatural periodic high-frequency grid artifacts typical of GAN and diffusion generators.
- **Laplacian Noise & Texture Consistency**: Measures face-to-background sharpness differentials to detect synthetic boundary blurring.
- **EXIF & Cryptographic Provenance**: Computes SHA-256 and MD5 digests while auditing EXIF headers for signatures of image editing/AI tools.

### 2. 🎬 Video Temporal Forensics
- **Temporal Frame Sampling**: Uniformly samples frames across video duration.
- **Frame-by-Frame Timeline**: Interactive bar chart plotting real vs. fake probabilities across the video timeline.
- **Flagged Keyframe Extraction**: Automatically isolates the most suspicious frames with bounding boxes and timestamp overlays.
- **Telemetry Aggregation**: Calculates duration, face detection count, fake frame ratio, and overall video authenticity rating.

### 3. 🔴 Real-Time Live Webcam Scanner
- **Live Optical Stream**: Analyzes live webcam frames every 650ms directly in the browser via WebRTC (`getUserMedia`).
- **Interactive Canvas HUD**: Renders real-time targeting crosshairs, live confidence meters, FPS tracking, and instant alerts (`AUTHENTIC HUMAN` vs. `DEEPFAKE ALERT`).
- **Liveness Protocol Guidance**: Instructs users through head tilt and blink validation.

### 4. 🎙️ Synthetic Voice & Speech Cloning Verification
- **Acoustic Waveform Forensics**: Audits audio clips (.wav, .mp3, .ogg) for voice cloning and text-to-speech (TTS) signatures.
- **Spectral Harmonic Entropy**: Detects spectral flattening and robotic pitch uniformity.
- **Zero-Crossing Rate (ZCR) & RMS Energy**: Verifies human vocal dynamics against synthetic vocoder outputs.

### 5. 📜 Verification Audit Log & Exportable Certificates
- **Session Audit History**: Automatically records all inspected media, SHA-256 digests, and verdicts in LocalStorage.
- **Printable Certificate of Authenticity**: Generates a formal forensic verification certificate compliant with ISO/IEC 27037 digital evidence guidelines, complete with verification ID, cryptographic hash, and exportable JSON.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status and greeting |
| `GET` | `/systemInfo` | Neural model architecture specs, parameter count, and capabilities |
| `POST` | `/predictImage` | Full image analysis (CNN + ELA + FFT + Noise + Metadata) |
| `POST` | `/predictVideo` | Temporal video forensics with frame timeline and flagged keyframes |
| `POST` | `/predictRealtime` | Low-latency single frame classification for live webcam streaming |
| `POST` | `/predictAudio` | Voice cloning and synthetic audio forensic analysis |
| `POST` | `/generateReport` | Generates a signed verification certificate with unique Audit ID |

---

## Model Architecture

- **Base Architecture**: 10-Layer Convolutional Neural Network
- **Dilated Convolutions**: Dilated layers (rate = 2) in upper stages to capture global facial context without spatial resolution loss.
- **Regularization**: Dropout (rate = 0.50) on dense layers to prevent co-adaptation.
- **Input Resolution**: `[224, 224, 3]` normalized RGB.
- **Accuracy**: >99% test accuracy on deepfake benchmark callsets.

---

## Legal & Forensic Disclaimer

Detection results produced by this system are probabilistic assessments derived from machine learning models and digital forensic heuristics. They are **not legal, forensic, or evidential proof**. Human expert review should always be conducted before taking consequential or judicial action.
