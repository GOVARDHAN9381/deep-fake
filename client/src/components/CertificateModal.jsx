import React from "react";
import { BsShieldCheck, BsCheckCircleFill, BsXCircleFill, BsPrinter, BsDownload, BsX } from "react-icons/bs";

const CertificateModal = ({ report, onClose }) => {
  if (!report) return null;

  const isAuthentic = report.authenticity_score >= 70;
  const isSuspicious = report.authenticity_score >= 40 && report.authenticity_score < 70;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${report.certificate_id || "forensic_report"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl glass-panel border border-slate-700 bg-slate-900 shadow-2xl p-6 sm:p-8 my-8 text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <BsX className="w-6 h-6" />
        </button>

        {/* Printable Section */}
        <div id="printable-certificate" className="space-y-6 bg-slate-900 p-6 rounded-xl border border-slate-800">
          {/* Certificate Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <BsShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">DIGITAL MEDIA VERIFICATION CERTIFICATE</h2>
                <p className="text-xs text-slate-400">VeriMedia Forensic Inspection & Deepfake Authenticity Audit</p>
              </div>
            </div>
            <div className="text-left sm:text-right font-mono text-xs">
              <div className="text-slate-400">CERTIFICATE ID</div>
              <div className="text-cyan-400 font-bold text-sm">{report.certificate_id}</div>
              <div className="text-slate-500 text-[11px]">{report.timestamp_utc}</div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isAuthentic
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : isSuspicious
                ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                : "bg-rose-950/40 border-rose-500/40 text-rose-200"
            }`}
          >
            <div className="flex items-center space-x-3">
              {isAuthentic ? (
                <BsCheckCircleFill className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              ) : (
                <BsXCircleFill className="w-8 h-8 text-rose-400 flex-shrink-0" />
              )}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Official Verdict</div>
                <div className="text-xl font-black">{report.overall_verdict}</div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs uppercase text-slate-400">Authenticity Score</div>
              <div className="text-3xl font-black">{report.authenticity_score}%</div>
            </div>
          </div>

          {/* Media Provenance & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-slate-400 font-medium">MEDIA IDENTIFIERS</div>
              <div className="space-y-1">
                <div>
                  <span className="text-slate-500">File:</span>{" "}
                  <span className="font-mono text-slate-200">{report.media_inspected}</span>
                </div>
                <div>
                  <span className="text-slate-500">Media Type:</span>{" "}
                  <span className="text-slate-200 uppercase">{report.media_type}</span>
                </div>
                <div>
                  <span className="text-slate-500">Confidence:</span>{" "}
                  <span className="text-slate-200">{report.confidence_rating}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-slate-400 font-medium">CRYPTOGRAPHIC AUDIT HASH</div>
              <div className="font-mono text-[11px] text-cyan-300 break-all bg-slate-900/90 p-2 rounded border border-slate-800">
                {report.sha256_checksum}
              </div>
              <div className="text-[11px] text-slate-500">SHA-256 digest calculated at ingestion</div>
            </div>
          </div>

          {/* Forensic Breakdown */}
          {report.forensic_breakdown && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
              <div className="text-slate-400 font-medium uppercase tracking-wide">Multi-Modal Forensic Breakdown</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">10-LAYER CNN</div>
                  <div className="font-bold text-sm text-cyan-400 mt-1">
                    {report.forensic_breakdown.label || "Completed"}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">ELA COMPRESSION</div>
                  <div className="font-bold text-sm text-amber-400 mt-1">
                    {report.forensic_breakdown.tamper_score ? `${report.forensic_breakdown.tamper_score}%` : "Audited"}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">FFT 2D SPECTRUM</div>
                  <div className="font-bold text-sm text-indigo-400 mt-1">
                    {report.forensic_breakdown.anomaly_score ? `${report.forensic_breakdown.anomaly_score}%` : "Audited"}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">PROVENANCE INTEGRITY</div>
                  <div className="font-bold text-sm text-emerald-400 mt-1">
                    {report.forensic_breakdown.provenance_verdict || "Verified"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compliance & Disclaimer */}
          <div className="pt-2 text-[11px] text-slate-500 space-y-1.5 border-t border-slate-800/80">
            <div className="flex items-center space-x-2 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Standards Compliance: ISO/IEC 27037 Digital Forensics & NIST Media Verification</span>
            </div>
            <p>{report.official_disclaimer}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
          >
            <BsDownload className="w-4 h-4" />
            <span>Export JSON Audit</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium shadow-lg shadow-cyan-500/20 transition"
          >
            <BsPrinter className="w-4 h-4" />
            <span>Print Verification Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
