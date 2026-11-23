import React from "react";
import { BsShieldCheck, BsCpu, BsActivity, BsBarChartLine } from "react-icons/bs";
import { FiImage, FiVideo, FiRadio, FiMic, FiArchive, FiInfo } from "react-icons/fi";

const Navbar = ({ activeTab, setActiveTab, apiOnline }) => {
  const navItems = [
    { id: "image", label: "Image Forensics", icon: FiImage },
    { id: "video", label: "Video Forensics", icon: FiVideo },
    { id: "realtime", label: "Live Scanner", icon: FiRadio, live: true },
    { id: "audio", label: "Voice Verification", icon: FiMic },
    { id: "history", label: "Audit Log (SQLite)", icon: FiArchive },
    { id: "benchmarks", label: "Datasets & Pipeline", icon: BsBarChartLine },
    { id: "specs", label: "Model Architecture", icon: FiInfo },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("image")}>
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20">
              <BsShieldCheck className="w-7 h-7 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                  DEEPSHIELD <span className="text-cyan-400 font-mono text-sm px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">v2.0</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Real-Time Deepfake Detection & Digital Media Verification System
              </p>
            </div>
          </div>

          {/* Engine Status Badge */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${apiOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
              <span className="text-slate-300 font-medium">
                {apiOnline ? "Neural Engine Active (10-Layer CNN)" : "Connecting API..."}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-400">
              <BsCpu className="text-cyan-400" />
              <span>ELA + FFT + Noise Forensics</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto pb-3 pt-1 scrollbar-none border-t border-slate-800/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.live && (
                  <span className="relative flex h-2 w-2 ml-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
