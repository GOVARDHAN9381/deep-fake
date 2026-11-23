#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "========================================="
echo "1. Installing Python dependencies"
echo "========================================="
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "========================================="
echo "2. Building Vite React Client"
echo "========================================="
cd client
npm install
npm run build
cd ..

echo "========================================="
echo "Build succeeded! Ready for deployment."
echo "========================================="
