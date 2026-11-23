import React from "react";
import { BsCpu, BsLayers, BsEye, BsShieldCheck, BsGraphUp } from "react-icons/bs";

const TechSpecs = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span>Model Architecture & Forensic Verification Engine</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
            Technical Specs
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Deep neural network topology, mathematical forensic principles, and multi-modal verification pipeline.
        </p>
      </div>

      {/* Top Architecture Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs font-mono">NEURAL TOPOLOGY</div>
          <div className="text-xl font-bold text-white">10-Layer Dilated CNN</div>
          <div className="text-[11px] text-cyan-400">Custom Keras Architecture</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs font-mono">TRAINABLE WEIGHTS</div>
          <div className="text-xl font-bold text-white">653,314</div>
          <div className="text-[11px] text-indigo-400">Optimized for low-latency CPU</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs font-mono">REGULARIZATION</div>
          <div className="text-xl font-bold text-white">Dropout (0.50)</div>
          <div className="text-[11px] text-amber-400">Prevents co-adaptation</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs font-mono">TEST ACCURACY</div>
          <div className="text-xl font-bold text-emerald-400">&gt; 99.0%</div>
          <div className="text-[11px] text-slate-400">Precision: 99.1% | Recall: 98.8%</div>
        </div>
      </div>

      {/* Core Methodology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: 10-Layer CNN */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BsCpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">10-Layer Dilated Convolutional Network</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The visual classifier uses stacked 2D convolutional layers. Early layers employ 5x5 kernels and 64 filters for low-level edge and texture extraction. Deeper layers introduce <strong>dilated convolutions (rate = 2)</strong>, expanding the receptive field to capture global facial proportions and unnatural warping without downsampling.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            Input: [224, 224, 3] Normalized RGB &bull; Activation: ReLU &bull; Output: 2-Class Softmax
          </div>
        </div>

        {/* Card 2: ELA */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <BsLayers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Error Level Analysis (ELA)</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              ELA exploits the lossy discrete cosine transform (DCT) of JPEG compression. When an image is spliced, modified, or face-swapped, the modified region possesses a different compression history than the background. Recompressing at 90% quality and computing amplified delta maps exposes tampering seams.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            Quality: 90% &bull; Amplification: 15x &bull; Colormap: JET Thermal Spectrum
          </div>
        </div>

        {/* Card 3: 2D FFT Spectrum */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BsEye className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">2D Fourier Transform (FFT) Analysis</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Generative Adversarial Networks (GANs like StyleGAN) and diffusion models leave distinct periodic grid artifacts in frequency space due to upsampling and transposed convolutions. By computing 2D FFT magnitude spectra, high-frequency energy spikes indicative of AI generation are pinpointed.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            Shifted Centered Spectrum &bull; Colormap: INFERNO &bull; Concentric Masking
          </div>
        </div>
      </div>

      {/* Model Architecture Diagram & Visuals */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <BsGraphUp className="text-cyan-400" />
          <span>Post-Training Verification Pipeline Architecture</span>
        </h3>
        <p className="text-xs text-slate-400">
          From multi-modal ingestion (image, video stream, voice clip) to cryptographic provenance certification:
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-center">
          <img
            src="/pipeline.png"
            alt="Pipeline Architecture"
            className="max-h-72 w-auto object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default TechSpecs;
