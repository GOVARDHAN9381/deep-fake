# How to Deploy to Render (Render.com)

This guide walks you through deploying the **AI-Based Real-Time Deepfake Detection & Digital Media Verification System** to [Render](https://render.com) on the **Free Tier**.

---

## Architecture of the Deployment

The project is configured for **Unified Full-Stack Deployment**:
- A single Render Web Service builds both the React Vite frontend and the Python FastAPI backend.
- FastAPI automatically serves:
  - The compiled React website and assets (`/`, `/assets/...`).
  - The machine learning and forensic API endpoints (`/predictImage`, `/predictVideo`, `/api/scans`, etc.).
  - Interactive Swagger documentation (`/docs`).
- **Benefit:** Requires only **1 Free Web Service** on Render, avoids multi-domain CORS hurdles, and stays within Render's free tier resources.

---

## Method 1: 1-Click Blueprint Deployment (Recommended)

Render provides Infrastructure-as-Code via the included `render.yaml` file.

### Step 1: Push Changes to GitHub
Make sure all your changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure Render deployment, SQLite database, and forensic suite"
git push origin main
```

### Step 2: Create a Blueprint on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click the **New +** button in the top right and select **Blueprint**.
3. Connect your GitHub account and select your `deepfake-detection` repository.
4. Render will automatically detect `render.yaml` and configure:
   - **Service Name:** `deepshield-forensics-app`
   - **Runtime:** `Python`
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn -k uvicorn.workers.UvicornWorker -w 1 -b 0.0.0.0:$PORT app:app`
   - **Environment Variables:** `PYTHON_VERSION=3.11.2`, `TF_ENABLE_ONEDNN_OPTS=0`
5. Click **Apply**.
6. Render will run the build script, install Python packages, compile the React website, and deploy your live URL (e.g., `https://deepshield-forensics-app.onrender.com`).

---

## Method 2: Manual Web Service Setup (Step-by-Step)

If you prefer setting up the web service manually through Render's UI:

### Step 1: Create Web Service
1. In the Render Dashboard, click **New +** -> **Web Service**.
2. Select **Build and deploy from a Git repository** and pick your GitHub repository.

### Step 2: Configure Service Details
Fill in the following fields:

| Field | Value |
|---|---|
| **Name** | `deepshield-forensics` *(or any preferred name)* |
| **Region** | `Oregon (US West)` *(or closest to your location)* |
| **Branch** | `main` |
| **Root Directory** | Leave blank *(or `deepfake-detection` if in a subfolder)* |
| **Runtime** | `Python 3` |
| **Build Command** | `./build.sh` |
| **Start Command** | `gunicorn -k uvicorn.workers.UvicornWorker -w 1 -b 0.0.0.0:$PORT app:app` |
| **Instance Type** | `Free` *(512 MB RAM, 0.1 CPU)* |

### Step 3: Add Environment Variables
Under the **Environment Variables** section, add:
- `PYTHON_VERSION`: `3.11.2`
- `NODE_VERSION`: `18.20.0`
- `TF_ENABLE_ONEDNN_OPTS`: `0`

### Step 4: Click "Create Web Service"
Render will now pull your repository, execute `./build.sh`, and launch the web server.

---

## Method 3: Docker Deployment (Alternative)

Render also supports native Docker container deployment using the included multi-stage `Dockerfile`:

1. In Render, click **New +** -> **Web Service**.
2. Select your repository.
3. Change **Runtime** from `Python` to **`Docker`**.
4. Render will automatically build using `Dockerfile` and start the container on port `10000`.

---

## Critical Render Optimization Tips

1. **Worker Count (`-w 1`)**:
   Render's free tier provides 512 MB of RAM. TensorFlow models require ~220 MB of memory. Setting `-w 1` in `Procfile` and `startCommand` ensures Gunicorn runs a single worker process, staying safely within the 512 MB limit without memory crashes.
2. **First Request Spin-up**:
   On the free tier, Render automatically spins down services after 15 minutes of inactivity. When someone visits the website after it has slept, it takes ~30 seconds to wake up. Once awake, response times are instantaneous.
3. **Database Persistence**:
   The SQLite database (`deepfake_forensics.db`) stores audits and verification certificates locally on disk. On Render free tier, the filesystem resets on new deployments. If persistent multi-month retention is required across redeployments, you can attach a Render Persistent Disk under the service's Disks tab.
