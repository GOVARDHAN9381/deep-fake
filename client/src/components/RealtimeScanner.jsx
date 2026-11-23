import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import {
  BsCameraVideo,
  BsShieldCheck,
  BsShieldX,
  BsStopCircle,
  BsPlayCircle,
  BsActivity,
  BsExclamationCircle,
} from "react-icons/bs";

const RealtimeScanner = ({ BASEURL }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [liveResult, setLiveResult] = useState(null);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const isScanningRef = useRef(false);

  const startScanner = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsScanning(true);
      isScanningRef.current = true;
      toast.success("Live camera stream initialized.");
    } catch (err) {
      setCameraError(err.message || "Unable to access camera.");
      toast.error("Camera permission denied or camera not found.");
    }
  };

  const stopScanner = () => {
    setIsScanning(false);
    isScanningRef.current = false;

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setLiveResult(null);
    toast.info("Scanner stopped.");
  };

  useEffect(() => {
    if (!isScanning) return;

    let lastTime = performance.now();
    let frameCount = 0;

    const captureAndPredict = async () => {
      if (!isScanningRef.current || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.readyState !== 4) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frameB64 = canvas.toDataURL("image/jpeg", 0.75);

      const startTime = performance.now();
      try {
        const res = await fetch(`${BASEURL}/predictRealtime`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: frameB64 }),
        });

        if (res.ok) {
          const data = await res.json();
          setLiveResult(data);
          const reqDuration = Math.round(performance.now() - startTime);
          setLatency(reqDuration);

          // Render Bounding Box and HUD on Canvas
          if (data.box) {
            const [x, y, w, h] = data.box;
            const isFake = data.result === 1;

            ctx.lineWidth = 3;
            ctx.strokeStyle = isFake ? "#f43f5e" : "#10b981";
            ctx.strokeRect(x, y, w, h);

            // Corner crosshairs
            const len = Math.min(w, h) * 0.2;
            ctx.strokeStyle = isFake ? "#ff0055" : "#00ffcc";
            ctx.lineWidth = 4;

            // Top-left
            ctx.beginPath();
            ctx.moveTo(x, y + len);
            ctx.lineTo(x, y);
            ctx.lineTo(x + len, y);
            ctx.stroke();

            // Label tag
            ctx.fillStyle = isFake ? "rgba(244, 63, 94, 0.9)" : "rgba(16, 185, 129, 0.9)";
            ctx.fillRect(x, Math.max(0, y - 28), w, 28);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px monospace";
            ctx.fillText(
              `${isFake ? "ALERT: FAKE" : "REAL"} ${data.confidence_percent}%`,
              x + 8,
              Math.max(18, y - 9)
            );
          }
        }
      } catch (err) {
        // Ignored in loop
      }

      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
    };

    scanIntervalRef.current = setInterval(captureAndPredict, 650);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isScanning, BASEURL]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Real-Time Live Deepfake & Liveness Scanner</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time optical feed auditing via webcam. Detects face swap filters, virtual avatars, and synthetic masks with ultra-low latency.
          </p>
        </div>

        {/* Action button */}
        <div>
          {!isScanning ? (
            <button
              onClick={startScanner}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition"
            >
              <BsPlayCircle className="w-4 h-4" />
              <span>Initialize Live Camera</span>
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-500/20 transition"
            >
              <BsStopCircle className="w-4 h-4" />
              <span>Terminate Feed</span>
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center space-x-2">
          <BsExclamationCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>Camera Access Error: {cameraError}. Ensure browser camera permissions are enabled.</span>
        </div>
      )}

      {/* Main Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Video / Canvas Screen */}
        <div className="lg:col-span-8">
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative bg-slate-950">
            {/* Viewport Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 text-xs font-mono text-slate-300">
              <span className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${isScanning ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                <span>{isScanning ? "FEED: LIVE ENCRYPTED STREAM" : "FEED: STANDBY"}</span>
              </span>
              <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                <span>FPS: {fps}</span>
                <span>LATENCY: {latency}ms</span>
              </div>
            </div>

            {/* Screen Container */}
            <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="hidden" />

              {isScanning ? (
                <canvas ref={canvasRef} className="w-full h-full object-contain" />
              ) : (
                <div className="text-center space-y-3 p-8">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <BsCameraVideo className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-300">Camera Feed Inactive</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Click "Initialize Live Camera" above to grant camera access and begin real-time verification.
                  </p>
                </div>
              )}

              {/* Live HUD Watermark */}
              {isScanning && (
                <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-cyan-400 border border-cyan-800/40">
                  DEEPSHIELD REALTIME CORE v2.0
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Telemetry & Liveness Guide */}
        <div className="lg:col-span-4 space-y-4">
          {/* Real-Time Live Status Card */}
          <div
            className={`p-6 rounded-2xl border transition-all ${
              liveResult?.result === 0
                ? "bg-emerald-950/30 border-emerald-500/40 glow-emerald"
                : liveResult?.result === 1
                ? "bg-rose-950/30 border-rose-500/40 glow-rose"
                : "bg-slate-900/80 border-slate-800"
            }`}
          >
            <div className="text-xs font-semibold uppercase text-slate-400">LIVE SENSOR TELEMETRY</div>
            <div className="mt-2 text-2xl font-black flex items-center space-x-2">
              {liveResult?.result === 0 ? (
                <>
                  <BsShieldCheck className="text-emerald-400 w-7 h-7" />
                  <span className="text-emerald-300">HUMAN VERIFIED</span>
                </>
              ) : liveResult?.result === 1 ? (
                <>
                  <BsShieldX className="text-rose-400 w-7 h-7" />
                  <span className="text-rose-300">DEEPFAKE ALERT</span>
                </>
              ) : (
                <span className="text-slate-400">WAITING FOR FACE...</span>
              )}
            </div>

            {liveResult && (
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Confidence:</span>
                  <span className="font-bold text-white">{liveResult.confidence_percent}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${liveResult.result === 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${liveResult.confidence_percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Liveness Guidance */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
            <div className="font-semibold text-slate-300 uppercase tracking-wide flex items-center space-x-2">
              <BsActivity className="text-cyan-400" />
              <span>Real-Time Liveness Protocol</span>
            </div>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">1.</span>
                <span>Keep your face centered inside the frame under adequate illumination.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">2.</span>
                <span>Slowly tilt your head left and right to verify continuous 3D facial mesh kinematics.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">3.</span>
                <span>Blink naturally. Deepfake face swapping filters often struggle with eyelid margin synthesis.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeScanner;
