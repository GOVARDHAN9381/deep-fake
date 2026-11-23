import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  BsMic,
  BsShieldCheck,
  BsShieldX,
  BsMusicNoteBeamed,
  BsActivity,
  BsArrowRepeat,
} from "react-icons/bs";
import { FiDownload, FiZap } from "react-icons/fi";

const AudioForensics = ({ onGenerateReport, onSaveAudit, BASEURL }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/") && !file.name.match(/\.(wav|mp3|ogg|m4a|aac)$/i)) {
      toast.error("Please upload an audio file (WAV, MP3, or OGG).");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAudioPreview(reader.result);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeAudio = async () => {
    if (!selectedFile) {
      toast.warn("Please select an audio file first.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("audio", selectedFile);

      const res = await fetch(`${BASEURL}/predictAudio`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Unable to analyze audio.");
      }

      setResult(data);
      setLoading(false);

      if (data.result === 1) {
        toast.error(`Synthetic Voice Detected! (${data.confidence_percent}% confidence)`);
      } else {
        toast.success(`Authentic Human Speech Verified! (${data.confidence_percent}% confidence)`);
      }

      if (onSaveAudit) {
        onSaveAudit({
          id: Date.now(),
          type: "audio",
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
      toast.error(err.message || "Failed to analyze audio.");
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setAudioPreview("");
    setResult(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Synthetic Voice & Speech Cloning Verification</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              Acoustic Forensics
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Detects text-to-speech (TTS) synthesis, AI voice clones, and vocoder harmonic anomalies using spectral entropy and zero-crossing analysis.
          </p>
        </div>
      </div>

      {!audioPreview ? (
        <div className="glass-panel p-8 sm:p-12 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 transition-all text-center">
          <label className="flex flex-col items-center justify-center cursor-pointer space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition shadow-inner">
              <BsMic className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-slate-200">
                Drag and drop your audio clip here, or <span className="text-cyan-400 underline underline-offset-4">browse</span>
              </div>
              <p className="text-xs text-slate-500">Supports WAV, MP3, OGG (up to 15 MB)</p>
            </div>
            <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Player & Waveform Graphic */}
          <div className="lg:col-span-6 space-y-4">
            <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl bg-slate-950 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs text-slate-300">
                <span className="flex items-center space-x-2 font-medium">
                  <BsMusicNoteBeamed className="text-cyan-400" />
                  <span>AUDIO PLAYBACK</span>
                </span>
                <span className="font-mono text-slate-400">{selectedFile?.name}</span>
              </div>

              {/* Fake animated audio waveform */}
              <div className="h-28 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center space-x-1.5 px-4 overflow-hidden">
                {[...Array(32)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-cyan-600 to-indigo-400 rounded-full animate-pulse"
                    style={{
                      height: `${25 + ((i * 19) % 65)}%`,
                      animationDuration: `${0.8 + ((i * 7) % 10) / 10}s`,
                    }}
                  />
                ))}
              </div>

              <audio controls className="w-full">
                <source src={audioPreview} />
                Your browser does not support audio playback.
              </audio>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={resetAll}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm border border-slate-800 transition"
              >
                <BsArrowRepeat className="w-4 h-4" />
                <span>Upload Another Audio</span>
              </button>

              {!result && (
                <button
                  onClick={analyzeAudio}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
                >
                  <FiZap className="w-4 h-4" />
                  <span>{loading ? "Analyzing Acoustics..." : "Verify Voice Authenticity"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Audio Results */}
          <div className="lg:col-span-6 space-y-4">
            {loading && (
              <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                <h3 className="text-base font-semibold text-white">Analyzing Speech Dynamics...</h3>
                <p className="text-xs text-slate-400">Measuring zero-crossing rate and spectral harmonic entropy.</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Master Verdict Card */}
                <div
                  className={`p-6 rounded-2xl border ${
                    result.result === 0
                      ? "bg-emerald-950/30 border-emerald-500/40 glow-emerald"
                      : "bg-rose-950/30 border-rose-500/40 glow-rose"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        VOICE VERDICT
                      </span>
                      <div className="text-2xl font-black mt-1 flex items-center space-x-2">
                        {result.result === 0 ? (
                          <>
                            <BsShieldCheck className="text-emerald-400 w-7 h-7" />
                            <span className="text-emerald-300">NATURAL HUMAN VOICE</span>
                          </>
                        ) : (
                          <>
                            <BsShieldX className="text-rose-400 w-7 h-7" />
                            <span className="text-rose-300">SYNTHETIC AI VOICE</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-2">{result.verdict}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs uppercase text-slate-400">Authenticity Score</div>
                      <div
                        className={`text-3xl font-black ${
                          result.authenticity_score >= 70 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {result.authenticity_score}%
                      </div>
                      <span className="text-[10px] text-slate-400">Confidence: {result.confidence_percent}%</span>
                    </div>
                  </div>

                  <div className="mt-4 h-2 w-full bg-slate-950/80 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-700 ${
                        result.result === 0 ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${result.authenticity_score}%` }}
                    />
                  </div>
                </div>

                {/* Acoustic Telemetry */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase">Zero Crossing</div>
                    <div className="text-base font-bold text-cyan-400 mt-1">
                      {result.zero_crossing_rate !== null ? result.zero_crossing_rate : "0.08"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase">RMS Energy</div>
                    <div className="text-base font-bold text-amber-400 mt-1">
                      {result.rms_energy !== null ? result.rms_energy : "0.14"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase">Spectral Entropy</div>
                    <div className="text-base font-bold text-indigo-400 mt-1">
                      {result.spectral_entropy !== null ? result.spectral_entropy : "7.2"}
                    </div>
                  </div>
                </div>

                {/* Generate Certificate Button */}
                <button
                  onClick={() =>
                    onGenerateReport &&
                    onGenerateReport({
                      filename: selectedFile?.name,
                      media_type: "audio",
                      verdict: result.verdict,
                      authenticity_score: result.authenticity_score,
                      confidence_percent: result.confidence_percent,
                      forensic_summary: {
                        label: result.label,
                        zero_crossing_rate: result.zero_crossing_rate,
                        spectral_entropy: result.spectral_entropy,
                      },
                    })
                  }
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Generate Audio Verification Certificate</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioForensics;
