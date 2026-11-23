# Multi-stage Dockerfile for Deepfake Detection & Media Verification System
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Install runtime dependencies for OpenCV and system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code, models, and database
COPY . .

# Copy compiled frontend from client-builder stage
COPY --from=client-builder /app/client/dist /app/client/dist

ENV PORT=10000
ENV TF_ENABLE_ONEDNN_OPTS=0
EXPOSE 10000

CMD ["sh", "-c", "gunicorn -k uvicorn.workers.UvicornWorker -w 1 -b 0.0.0.0:$PORT app:app"]
