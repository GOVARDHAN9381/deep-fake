import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import {
  BsUpload,
  BsShieldCheck,
  BsShieldExclamation,
  BsShieldX,
  BsEye,
  BsCpu,
  BsLayers,
  BsFileEarmarkLock,
  BsCheck2Square,
  BsClipboard,
  BsArrowRepeat,
} from "react-icons/bs";
import { FiImage, FiZap, FiDownload } from "react-icons/fi";

const ImageForensics = ({ onGenerateReport, onSaveAudit, BASEURL }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [result, setResult] = useState(null);
  const [activeView, setActiveView] = useState("original"); // 'original', 'ela', 'heatmap', 'fft'
  const canvasRef = useRef(null);

  // Quick Demo Samples
  const demoSamples = [
    { name: "Sample Deepfake", url: "/deepfake.jpg", label: "Known Manipulation" },
    { name: "Synthesized Face", url: "/deepfake.png", label: "AI Generated" },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image (JPEG, PNG, or WebP).");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setResult(null);
      setActiveView("original");
    };
    reader.readAsDataURL(file);
  };

  const loadSample = async (sample) => {
    try {
      setLoading(true);
      setLoadingStage("Fetching demo sample...");
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], sample.url.split("/").pop(), { type: blob.type || "image/jpeg" });
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setResult(null);
        setActiveView("original");
        setLoading(false);
      };
      reader.readAsDataURL(file);
      toast.info(`Loaded ${sample.name}. Click 'Verify Media' to analyze.`);
    } catch (err) {
      setLoading(false);
      toast.error("Could not load sample file.");
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) {
      toast.warn("Please select or upload an image first.");
      return;
    }

    try {
      setLoading(true);
      setLoadingStage("Executing 10-Layer Dilated CNN face classification...");

      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await fetch(`${BASEURL}/predictImage`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Unable to analyze image.");
      }

      setResult(data);
      setLoading(false);

      if (data.result === 1) {
        toast.error(`Deepfake Detected! (${data.confidence_percent}% confidence)`);
      } else if (data.result === 0) {
        toast.success(`Authentic Image Verified! (${data.confidence_percent}% confidence)`);
      } else {
        toast.warn("No human face detected in image.");
      }

      // Log to audit history
      if (onSaveAudit) {
        onSaveAudit({
          id: Date.now(),
          type: "image",
          filename: selectedFile.name,
          timestamp: new Date().toLocaleTimeString(),
          verdict: data.verdict || data.label,
          authenticity_score: data.authenticity_score || (data.result === 0 ? 95 : 10),
          confidence: data.confidence_percent,
          sha256: data.metadata?.sha256,
          raw: data,
        });
      }
    } catch (err) {
      setLoading(false);
      toast.error(err.message || "Failed to analyze image.");
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setImagePreview("");
    setResult(null);
    setActiveView("original");
  };

  const copyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    toast.success("SHA-256 hash copied to clipboard!");
  };

  // Draw face bounding boxes on canvas over original image
  useEffect(() => {
    if (!result || !imagePreview || activeView !== "original") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = imagePreview;

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      if (result.faces && result.faces.length > 0) {
        result.faces.forEach((face, idx) => {
          const [x, y, w, h] = face.box;
          const isFake = face.result === 1;

          // Draw Bounding Box
          ctx.strokeStyle = isFake ? "#f43f5e" : "#10b981";
          ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.004));
          ctx.strokeRect(x, y, w, h);

          // Tag background
          ctx.fillStyle = isFake ? "rgba(244, 63, 94, 0.9)" : "rgba(16, 185, 129, 0.9)";
          const labelText = `Face #${idx + 1}: ${face.label} ${face.confidence_percent}%`;
          ctx.font = `bold ${Math.max(14, Math.round(canvas.width * 0.02))}px monospace`;
          const textMetrics = ctx.measureText(labelText);
          const bgHeight = Math.max(22, Math.round(canvas.width * 0.025));
          ctx.fillRect(x, Math.max(0, y - bgHeight), textMetrics.width + 12, bgHeight);

          // Tag text
          ctx.fillStyle = "#ffffff";
          ctx.fillText(labelText, x + 6, Math.max(bgHeight - 6, y - 6));
        });
      }
    };
  }, [result, imagePreview, activeView]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Tab Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Image Forensics & Deepfake Detection Studio</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              Multi-Spectral
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Detects face swaps, GAN synthesis, and localized re-compression anomalies using 10-layer Dilated CNN, ELA, and 2D Fourier Spectrograms.
          </p>
        </div>

        {/* Demo Samples Selector */}
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Quick Demos:</span>
          {demoSamples.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => loadSample(sample)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Zone & Interactive Preview */}
      {!imagePreview ? (
        <div className="glass-panel p-8 sm:p-12 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 transition-all text-center">
          <label className="flex flex-col items-center justify-center cursor-pointer space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition shadow-inner">
              <BsUpload className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-slate-200">
                Drag and drop your image here, or <span className="text-cyan-400 underline underline-offset-4">browse</span>
              </div>
              <p className="text-xs text-slate-500">Supports JPEG, PNG, and WebP (up to 10 MB)</p>
            </div>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Inspector (Canvas / ELA / FFT) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative bg-slate-950/80">
              {/* View Mode Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 text-xs">
                <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                  <BsEye className="text-cyan-400" />
                  <span>INSPECTION VIEW:</span>
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveView("original")}
                    className={`px-2.5 py-1 rounded text-xs transition ${
                      activeView === "original"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Face Detection
                  </button>
                  <button
                    onClick={() => setActiveView("ela")}
                    disabled={!result?.ela?.ela_image}
                    className={`px-2.5 py-1 rounded text-xs transition ${
                      activeView === "ela"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-white disabled:opacity-40"
                    }`}
                  >
                    ELA Diff
                  </button>
                  <button
                    onClick={() => setActiveView("heatmap")}
                    disabled={!result?.ela?.heatmap_image}
                    className={`px-2.5 py-1 rounded text-xs transition ${
                      activeView === "heatmap"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-white disabled:opacity-40"
                    }`}
                  >
                    Thermal Heatmap
                  </button>
                  <button
                    onClick={() => setActiveView("fft")}
                    disabled={!result?.fft?.spectrum_image}
                    className={`px-2.5 py-1 rounded text-xs transition ${
                      activeView === "fft"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-white disabled:opacity-40"
                    }`}
                  >
                    2D FFT Spectrum
                  </button>
                </div>
              </div>

              {/* Viewer Screen */}
              <div className="p-4 flex items-center justify-center min-h-[360px] bg-slate-950">
                {activeView === "original" && (
                  <canvas
                    ref={canvasRef}
                    className="max-h-[500px] w-auto max-w-full rounded-xl object-contain shadow-md"
                  />
                )}
                {activeView === "ela" && result?.ela?.ela_image && (
                  <img
                    src={result.ela.ela_image}
                    alt="Error Level Analysis"
                    className="max-h-[500px] w-auto max-w-full rounded-xl object-contain shadow-md"
                  />
                )}
                {activeView === "heatmap" && result?.ela?.heatmap_image && (
                  <img
                    src={result.ela.heatmap_image}
                    alt="Thermal ELA Heatmap"
                    className="max-h-[500px] w-auto max-w-full rounded-xl object-contain shadow-md"
                  />
                )}
                {activeView === "fft" && result?.fft?.spectrum_image && (
                  <img
                    src={result.fft.spectrum_image}
                    alt="2D FFT Fourier Spectrum"
                    className="max-h-[500px] w-auto max-w-full rounded-xl object-contain shadow-md"
                  />
                )}
              </div>

              {/* View description caption */}
              <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  {activeView === "original" && "Original media with automated face bounding box & confidence overlays"}
                  {activeView === "ela" && "Error Level Analysis: highlights differences in compression history and splice seams"}
                  {activeView === "heatmap" && "Color-mapped JET gradient: warmer hues indicate localized compression anomalies"}
                  {activeView === "fft" && "2D Fourier Transform: highlights high-frequency grid artifacts typical of GAN/diffusion generators"}
                </span>
                <span className="font-mono text-slate-500">{selectedFile?.name}</span>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={resetAll}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm border border-slate-800 transition"
              >
                <BsArrowRepeat className="w-4 h-4" />
                <span>Upload Another Image</span>
              </button>

              {!result && (
                <button
                  onClick={analyzeImage}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
                >
                  <FiZap className="w-4 h-4" />
                  <span>{loading ? "Analyzing Media..." : "Run Forensic Verification"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Forensic Results Dashboard */}
          <div className="lg:col-span-5 space-y-4">
            {loading && (
              <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                <div>
                  <h3 className="text-base font-semibold text-white">Forensic Engine Scanning...</h3>
                  <p className="text-xs text-slate-400 mt-1">{loadingStage}</p>
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <BsCpu className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">Ready for Forensic Inspection</h3>
                <p className="text-xs text-slate-400">
                  Click <strong className="text-cyan-400 font-semibold">Run Forensic Verification</strong> to execute the 10-layer neural network, compute ELA compression deltas, and analyze high-frequency spectra.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Master Verdict Card */}
                <div
                  className={`p-6 rounded-2xl border relative overflow-hidden ${
                    result.result === 0
                      ? "bg-emerald-950/30 border-emerald-500/40 glow-emerald"
                      : result.result === 1
                      ? "bg-rose-950/30 border-rose-500/40 glow-rose"
                      : "bg-slate-900/60 border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        VERDICT STATUS
                      </span>
                      <div className="text-2xl font-black mt-1 flex items-center space-x-2">
                        {result.result === 0 ? (
                          <>
                            <BsShieldCheck className="text-emerald-400 w-7 h-7" />
                            <span className="text-emerald-300">AUTHENTIC MEDIA</span>
                          </>
                        ) : result.result === 1 ? (
                          <>
                            <BsShieldX className="text-rose-400 w-7 h-7" />
                            <span className="text-rose-300">DEEPFAKE DETECTED</span>
                          </>
                        ) : (
                          <>
                            <BsShieldExclamation className="text-amber-400 w-7 h-7" />
                            <span className="text-amber-300">NO FACE DETECTED</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-2">
                        {result.verdict || "Classification complete."}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs uppercase text-slate-400">Authenticity Score</div>
                      <div
                        className={`text-3xl font-black ${
                          result.authenticity_score >= 70
                            ? "text-emerald-400"
                            : result.authenticity_score >= 40
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {result.authenticity_score !== undefined ? `${result.authenticity_score}%` : `${result.confidence_percent}%`}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Confidence: {result.confidence_percent}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 h-2 w-full bg-slate-950/80 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-700 ${
                        result.result === 0 ? "bg-emerald-500" : result.result === 1 ? "bg-rose-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${result.authenticity_score || result.confidence_percent}%` }}
                    />
                  </div>
                </div>

                {/* Manipulation Category Taxonomy Banner (Inspired by aaronchong888/DeepFake-Detect) */}
                {result.manipulation_type && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium uppercase tracking-wide">
                        MANIPULATION CATEGORY
                      </span>
                      <span className="font-mono text-cyan-400 font-bold text-[11px]">
                        {result.manipulation_type.subtype}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${result.result === 1 ? "bg-rose-500" : "bg-emerald-500"}`} />
                      <span>{result.manipulation_type.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {result.manipulation_type.description}
                    </p>
                    {result.manipulation_type.key_indicators && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {result.manipulation_type.key_indicators.map((ind, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono"
                          >
                            &bull; {ind}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Multi-Model Ensemble Card (10-Layer CNN vs. EfficientNet vs. Spatial-Frequency) */}
                {result.ensemble && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium uppercase tracking-wide">
                        MULTI-MODEL ENSEMBLE CONSENSUS
                      </span>
                      <span className="text-cyan-400 font-bold font-mono">
                        {result.ensemble.consensus_label} ({result.ensemble.consensus_confidence_percent}%)
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {result.ensemble.models?.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{m.name}</div>
                            <div className="text-[10px] text-slate-500">{m.backbone}</div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-bold ${
                                m.prediction === "Fake" ? "text-rose-400" : "text-emerald-400"
                              }`}
                            >
                              {m.prediction} {m.confidence_percent}%
                            </span>
                            <div className="text-[10px] text-slate-500">Weight: {m.weight}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Forensic Metric Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* CNN Metric */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>10-LAYER CNN</span>
                      <BsCpu className="text-cyan-400" />
                    </div>
                    <div className="text-base font-bold text-white">
                      {result.label} ({result.confidence_percent}%)
                    </div>
                    <p className="text-[11px] text-slate-500">Softmax binary output</p>
                  </div>

                  {/* ELA Metric */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>ELA TAMPER RISK</span>
                      <BsLayers className="text-amber-400" />
                    </div>
                    <div className="text-base font-bold text-white">
                      {result.ela?.tamper_score ? `${result.ela.tamper_score}%` : "Audited"}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {result.ela?.tamper_detected ? "High compression variance" : "Normal compression profile"}
                    </p>
                  </div>

                  {/* FFT Metric */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>FFT 2D SPECTRUM</span>
                      <BsEye className="text-indigo-400" />
                    </div>
                    <div className="text-base font-bold text-white">
                      {result.fft?.anomaly_score ? `${result.fft.anomaly_score}%` : "Audited"}
                    </div>
                    <p className="text-[11px] text-slate-500">High-frequency GAN grid check</p>
                  </div>

                  {/* Texture Consistency */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>TEXTURE CONSISTENCY</span>
                      <BsCheck2Square className="text-emerald-400" />
                    </div>
                    <div className="text-base font-bold text-white">
                      {result.noise?.texture_consistency_score ? `${result.noise.texture_consistency_score}%` : "Consistent"}
                    </div>
                    <p className="text-[11px] text-slate-500">Laplacian boundary sharpness</p>
                  </div>
                </div>

                {/* Cryptographic SHA-256 Digest */}
                {result.metadata?.sha256 && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center space-x-1.5">
                        <BsFileEarmarkLock className="text-cyan-400" />
                        <span>CRYPTOGRAPHIC SHA-256 PROVENANCE</span>
                      </span>
                      <button
                        onClick={() => copyHash(result.metadata.sha256)}
                        className="text-slate-400 hover:text-white flex items-center space-x-1"
                        title="Copy hash"
                      >
                        <BsClipboard className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </button>
                    </div>
                    <div className="font-mono text-[11px] text-cyan-300 break-all bg-slate-950 p-2 rounded border border-slate-800/80">
                      {result.metadata.sha256}
                    </div>
                    {result.metadata.provenance_verdict && (
                      <div className="text-[11px] text-slate-400">
                        Provenance Status: <strong className="text-slate-200">{result.metadata.provenance_verdict}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Certificate Action */}
                <button
                  onClick={() =>
                    onGenerateReport &&
                    onGenerateReport({
                      filename: selectedFile?.name,
                      media_type: "image",
                      verdict: result.verdict || result.label,
                      authenticity_score: result.authenticity_score || (result.result === 0 ? 95 : 10),
                      confidence_percent: result.confidence_percent,
                      sha256: result.metadata?.sha256,
                      forensic_summary: {
                        label: result.label,
                        tamper_score: result.ela?.tamper_score,
                        anomaly_score: result.fft?.anomaly_score,
                        provenance_verdict: result.metadata?.provenance_verdict,
                      },
                    })
                  }
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Generate Digital Verification Certificate</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageForensics;
