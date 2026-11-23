import React, { useState, useEffect } from "react";
import { BsGrid3X3Gap, BsCpu, BsBarChartLine, BsFilm, BsCheckCircleFill, BsShieldCheck } from "react-icons/bs";
import { FiDatabase, FiLayers, FiCode, FiArrowRight } from "react-icons/fi";

const Benchmarks = ({ BASEURL }) => {
  const [benchmarks, setBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        const res = await fetch(`${BASEURL}/api/benchmarks`);
        if (res.ok) {
          const data = await res.json();
          setBenchmarks(data.benchmarks || []);
        }
      } catch (err) {
        console.error("Failed to load benchmarks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBenchmarks();
  }, [BASEURL]);

  const pipelineSteps = [
    {
      step: "00",
      title: "Video Frame Extraction",
      script: "00-convert_video_to_image.py",
      desc: "Deconstructs input video stream into sequential uncompressed RGB frames at uniform temporal intervals.",
      icon: BsFilm,
      badge: "OpenCV VideoCapture",
    },
    {
      step: "01",
      title: "MTCNN Face Extraction & Alignment",
      script: "01a-crop_faces_with_mtcnn.py",
      desc: "Multi-Task Cascaded CNN isolates facial bounding boxes, computes eye/nose landmarks, and applies safety margin padding.",
      icon: FiLayers,
      badge: "MTCNN / Haar Cascade",
    },
    {
      step: "02",
      title: "Balanced Dataset Preparation",
      script: "02-prepare_fake_real_dataset.py",
      desc: "Splits real and manipulated faces into train, validation, and test partitions, normalized to [224x224x3] tensors.",
      icon: FiDatabase,
      badge: "Train/Val/Test Split",
    },
    {
      step: "03",
      title: "Multi-Model Ensemble Training",
      script: "03-train_cnn.py",
      desc: "Trains 10-Layer Dilated CNN and fine-tunes EfficientNet-B0 transfer learning backbones with 0.5 dropout regularization.",
      icon: BsCpu,
      badge: "EfficientNet & Dilated CNN",
    },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Forensics Pipeline & Deepfake Benchmark Callsets</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              aaronchong888/DeepFake-Detect Architecture
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            End-to-end media preprocessing pipeline and cross-dataset evaluation across standard forensic research benchmarks.
          </p>
        </div>
      </div>

      {/* End-to-End Pipeline Visualization */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
          <FiCode className="text-cyan-400" />
          <span>Automated 4-Stage Deepfake Detection Pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition group relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-900">
                      STAGE {step.step}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                    {step.title}
                  </h3>
                  <div className="font-mono text-[11px] text-slate-400 mt-1">{step.script}</div>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{step.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{step.badge}</span>
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <BsCheckCircleFill className="w-3 h-3" />
                    <span>Validated</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Dataset Benchmark Evaluation Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
            <BsBarChartLine className="text-cyan-400" />
            <span>Standard Media Forensic Benchmark Callsets</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">5 Major Datasets Evaluated</span>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4">Benchmark Dataset</th>
                  <th className="px-5 py-4">Origin / Institution</th>
                  <th className="px-5 py-4">Manipulation Subsets</th>
                  <th className="px-5 py-4">AUC-ROC</th>
                  <th className="px-5 py-4">Accuracy</th>
                  <th className="px-5 py-4">F1 Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {benchmarks.map((ds) => (
                  <tr key={ds.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{ds.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ds.description}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 whitespace-nowrap">{ds.creator}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {ds.subsets?.map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold text-cyan-400 text-sm font-mono">{ds.auc}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold text-emerald-400 text-sm font-mono">{ds.accuracy}%</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold text-indigo-400 text-sm font-mono">{ds.f1_score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Model Backbone Generalization Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-xs font-semibold uppercase text-cyan-400 flex items-center space-x-1.5">
            <BsCpu />
            <span>EfficientNet vs. Dilated CNN Generalization</span>
          </div>
          <h3 className="text-base font-bold text-white">Why EfficientNet + Dilated CNN?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Standard deep CNNs often overfit to dataset-specific compression artifacts. Combining <strong>EfficientNet inverted residual blocks (MBConv)</strong> with <strong>Dilated Convolutions</strong> enables the model to capture high-resolution local frequency features while widening the contextual receptive field across disparate datasets (FaceForensics++ c23/c40 and Celeb-DF).
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-xs font-semibold uppercase text-emerald-400 flex items-center space-x-1.5">
            <BsShieldCheck />
            <span>Forensic Chain of Custody & Database</span>
          </div>
          <h3 className="text-base font-bold text-white">Persistent SQLite Evidence Store</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every analyzed video frame sequence, image crop, and cryptographic SHA-256 digest is permanently written to the internal <strong>SQLite Forensic Database</strong>. This guarantees tamper-evident provenance tracking and verifiable certificate retrieval per ISO/IEC 27037 standards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Benchmarks;
