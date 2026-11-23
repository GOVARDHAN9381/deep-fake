import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  BsUpload,
  BsShieldCheck,
  BsShieldX,
  BsShieldExclamation,
  BsPlayCircle,
  BsClockHistory,
  BsCollectionPlay,
  BsCameraVideo,
  BsArrowRepeat,
} from "react-icons/bs";
import { FiDownload, FiZap } from "react-icons/fi";

const VideoForensics = ({ onGenerateReport, onSaveAudit, BASEURL }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a valid video file (MP4, WebM, or MOV).");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeVideo = async () => {
    if (!selectedFile) {
      toast.warn("Please select a video file first.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("video", selectedFile);

      const res = await fetch(`${BASEURL}/predictVideo`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Unable to analyze video.");
      }

      setResult(data);
      setLoading(false);

      if (data.result === 1) {
        toast.error(`Deepfake Video Detected! (${data.fake_frames_count} manipulated frames found)`);
      } else if (data.result === 0) {
        toast.success(`Authentic Video Verified! (${data.confidence_percent}% confidence)`);
      } else {
        toast.warn("No human faces detected across video frames.");
      }

      if (onSaveAudit) {
        onSaveAudit({
          id: Date.now(),
          type: "video",
          filename: selectedFile.name,
          timestamp: new Date().toLocaleTimeString(),
          verdict: data.verdict || data.label,
          authenticity_score: data.authenticity_score,
          confidence: data.confidence_percent,
          raw: data,
        });
      }
    } catch (err) {
      setLoading(false);
      toast.error(err.message || "Failed to analyze video.");
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setVideoPreview("");
    setResult(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Tab Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Video Temporal Deepfake & Motion Forensics</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              Temporal Sampling
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Samples video frames uniformly across duration, identifies face swap boundaries, and detects temporal flicker and warping.
          </p>
        </div>
      </div>

      {!videoPreview ? (
        <div className="glass-panel p-8 sm:p-12 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 transition-all text-center">
          <label className="flex flex-col items-center justify-center cursor-pointer space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition shadow-inner">
              <BsCameraVideo className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-slate-200">
                Drag and drop your video here, or <span className="text-cyan-400 underline underline-offset-4">browse</span>
              </div>
              <p className="text-xs text-slate-500">Supports MP4, WebM, MOV (up to 35 MB)</p>
            </div>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Video Player */}
          <div className="lg:col-span-6 space-y-4">
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 text-xs font-medium text-slate-300 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <BsPlayCircle className="text-cyan-400" />
                  <span>MEDIA PLAYBACK & SCRUBBER</span>
                </span>
                <span className="font-mono text-slate-400">{selectedFile?.name}</span>
              </div>
              <div className="p-4 bg-black flex items-center justify-center">
                <video controls className="w-full max-h-[420px] rounded-xl shadow-lg">
                  <source src={videoPreview} />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={resetAll}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm border border-slate-800 transition"
              >
                <BsArrowRepeat className="w-4 h-4" />
                <span>Upload Another Video</span>
              </button>

              {!result && (
                <button
                  onClick={analyzeVideo}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
                >
                  <FiZap className="w-4 h-4" />
                  <span>{loading ? "Analyzing Video Frames..." : "Run Temporal Verification"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Video Forensics Output */}
          <div className="lg:col-span-6 space-y-4">
            {loading && (
              <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                <div>
                  <h3 className="text-base font-semibold text-white">Extracting & Classifying Frames...</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Analyzing facial kinematics and boundary stability across temporal slices.
                  </p>
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <BsCollectionPlay className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">Video Ready for Verification</h3>
                <p className="text-xs text-slate-400">
                  Click <strong className="text-cyan-400 font-semibold">Run Temporal Verification</strong> to sample frames and audit motion authenticity.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Verdict Card */}
                <div
                  className={`p-6 rounded-2xl border ${
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
                        VIDEO VERDICT
                      </span>
                      <div className="text-2xl font-black mt-1 flex items-center space-x-2">
                        {result.result === 0 ? (
                          <>
                            <BsShieldCheck className="text-emerald-400 w-7 h-7" />
                            <span className="text-emerald-300">AUTHENTIC VIDEO</span>
                          </>
                        ) : result.result === 1 ? (
                          <>
                            <BsShieldX className="text-rose-400 w-7 h-7" />
                            <span className="text-rose-300">DEEPFAKE VIDEO DETECTED</span>
                          </>
                        ) : (
                          <>
                            <BsShieldExclamation className="text-amber-400 w-7 h-7" />
                            <span className="text-amber-300">INCONCLUSIVE</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-2">{result.verdict}</p>
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
                        {result.authenticity_score}%
                      </div>
                      <span className="text-[10px] text-slate-400">Confidence: {result.confidence_percent}%</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4 h-2 w-full bg-slate-950/80 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-700 ${
                        result.result === 0 ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${result.authenticity_score}%` }}
                    />
                  </div>
                </div>

                {/* Video Telemetry Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase">Frames Sampled</div>
                    <div className="text-lg font-bold text-white mt-1">{result.total_frames_sampled}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase">Face Detections</div>
                    <div className="text-lg font-bold text-cyan-400 mt-1">{result.faces_found_count}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase">Fake Frames</div>
                    <div className="text-lg font-bold text-rose-400 mt-1">{result.fake_frames_count}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase">Manipulated Ratio</div>
                    <div className="text-lg font-bold text-amber-400 mt-1">{result.fake_frame_ratio}%</div>
                  </div>
                </div>

                {/* Frame Timeline Visualizer */}
                {result.timeline && result.timeline.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center space-x-1.5 font-medium">
                        <BsClockHistory className="text-cyan-400" />
                        <span>TEMPORAL FRAME TIMELINE</span>
                      </span>
                      <span className="text-[11px] text-slate-500">Each bar = 1 Sampled Frame</span>
                    </div>

                    <div className="flex items-end space-x-1 h-20 pt-2 px-1 bg-slate-950 rounded-lg overflow-x-auto border border-slate-800">
                      {result.timeline.map((frame, idx) => {
                        const isFake = frame.result === 1;
                        const heightPct = Math.max(20, Math.round(frame.confidence * 100));
                        return (
                          <div
                            key={idx}
                            title={`Frame ${frame.frame_index} (${frame.time_formatted}): ${frame.label} ${frame.confidence_percent}%`}
                            className="flex-1 min-w-[10px] flex flex-col items-center group cursor-pointer"
                          >
                            <div
                              className={`w-full rounded-t transition-all ${
                                isFake ? "bg-rose-500 group-hover:bg-rose-400" : "bg-emerald-500 group-hover:bg-emerald-400"
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Flagged Keyframes Gallery */}
                {result.flagged_keyframes && result.flagged_keyframes.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                      Flagged Anomalous Keyframes ({result.flagged_keyframes.length})
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {result.flagged_keyframes.map((kf, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                          <img src={kf.image} alt={`Keyframe ${kf.timestamp}`} className="w-full h-24 object-cover" />
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                            {kf.timestamp}
                          </div>
                          <div
                            className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              kf.label === "Fake" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                            }`}
                          >
                            {kf.label} {kf.confidence_percent}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generate Certificate Button */}
                <button
                  onClick={() =>
                    onGenerateReport &&
                    onGenerateReport({
                      filename: selectedFile?.name,
                      media_type: "video",
                      verdict: result.verdict,
                      authenticity_score: result.authenticity_score,
                      confidence_percent: result.confidence_percent,
                      forensic_summary: {
                        label: result.label,
                        total_frames: result.total_frames_sampled,
                        fake_frames: result.fake_frames_count,
                        fake_frame_ratio: `${result.fake_frame_ratio}%`,
                      },
                    })
                  }
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Generate Video Forensic Certificate</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoForensics;
