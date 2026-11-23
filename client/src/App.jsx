import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import ImageForensics from "./components/ImageForensics";
import VideoForensics from "./components/VideoForensics";
import RealtimeScanner from "./components/RealtimeScanner";
import AudioForensics from "./components/AudioForensics";
import AuditHistory from "./components/AuditHistory";
import Benchmarks from "./components/Benchmarks";
import TechSpecs from "./components/TechSpecs";
import CertificateModal from "./components/CertificateModal";

const App = () => {
  const BASEURL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.port === "5173" ? "http://localhost:8000" : "");

  const [activeTab, setActiveTab] = useState("image");
  const [apiOnline, setApiOnline] = useState(false);
  const [activeReport, setActiveReport] = useState(null);

  // Load audit history from LocalStorage
  const [auditHistory, setAuditHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("deepshield_audit_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Verify backend health on mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const res = await fetch(`${BASEURL}/`);
        if (res.ok) {
          setApiOnline(true);
        } else {
          setApiOnline(false);
        }
      } catch {
        setApiOnline(false);
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 15000);
    return () => clearInterval(interval);
  }, [BASEURL]);

  // Persist audit history
  const handleSaveAudit = (entry) => {
    setAuditHistory((prev) => {
      const updated = [entry, ...prev.slice(0, 49)];
      try {
        localStorage.setItem("deepshield_audit_history", JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setAuditHistory([]);
    try {
      localStorage.removeItem("deepshield_audit_history");
    } catch {
      // Ignored
    }
    toast.info("Audit log cleared.");
  };

  const handleGenerateReport = async (payload) => {
    try {
      const res = await fetch(`${BASEURL}/generateReport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Unable to generate verification certificate.");
      }

      const reportData = await res.json();
      setActiveReport(reportData);
    } catch (err) {
      toast.error(err.message || "Failed to generate report.");
    }
  };

  const handleViewCertificate = (reportData) => {
    handleGenerateReport(reportData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} apiOnline={apiOnline} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "image" && (
          <ImageForensics
            onGenerateReport={handleGenerateReport}
            onSaveAudit={handleSaveAudit}
            BASEURL={BASEURL}
          />
        )}
        {activeTab === "video" && (
          <VideoForensics
            onGenerateReport={handleGenerateReport}
            onSaveAudit={handleSaveAudit}
            BASEURL={BASEURL}
          />
        )}
        {activeTab === "realtime" && <RealtimeScanner BASEURL={BASEURL} />}
        {activeTab === "audio" && (
          <AudioForensics
            onGenerateReport={handleGenerateReport}
            onSaveAudit={handleSaveAudit}
            BASEURL={BASEURL}
          />
        )}
        {activeTab === "history" && (
          <AuditHistory
            onViewCertificate={handleViewCertificate}
            BASEURL={BASEURL}
          />
        )}
        {activeTab === "benchmarks" && <Benchmarks BASEURL={BASEURL} />}
        {activeTab === "specs" && <TechSpecs />}
      </main>

      {/* Verification Certificate Modal */}
      {activeReport && (
        <CertificateModal report={activeReport} onClose={() => setActiveReport(null)} />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            &copy; {new Date().getFullYear()} DeepShield AI Forensics Studio &bull; Real-Time Deepfake Detection & Digital Media Verification System
          </div>
          <div className="text-[11px] text-amber-500/80">
            Disclaimer: Detection results are probabilistic predictions and are not legal, forensic, or evidential proof.
          </div>
        </div>
      </footer>

      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default App;
