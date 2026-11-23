import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  BsArchive,
  BsShieldCheck,
  BsShieldX,
  BsShieldExclamation,
  BsTrash3,
  BsEye,
  BsSearch,
  BsFilter,
  BsFileEarmarkLock,
  BsActivity,
} from "react-icons/bs";
import { FiImage, FiVideo, FiMic, FiRefreshCw } from "react-icons/fi";

const AuditHistory = ({ onViewCertificate, BASEURL }) => {
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const loadDatabaseData = async () => {
    try {
      setLoading(true);

      // Fetch scans with optional search & filter
      let url = `${BASEURL}/api/scans?limit=100`;
      if (selectedType !== "all") {
        url += `&media_type=${selectedType}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const [scansRes, statsRes] = await Promise.all([
        fetch(url),
        fetch(`${BASEURL}/api/stats`),
      ]);

      if (scansRes.ok) {
        const data = await scansRes.json();
        setScans(data.scans || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Error fetching database logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, [BASEURL, selectedType, searchTerm]);

  const handleDeleteScan = async (scanId) => {
    try {
      const res = await fetch(`${BASEURL}/api/scans/${scanId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setScans((prev) => prev.filter((s) => s.id !== scanId));
        toast.info("Audit record deleted from SQLite database.");
        // refresh stats
        const statsRes = await fetch(`${BASEURL}/api/stats`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        toast.error("Failed to delete record.");
      }
    } catch {
      toast.error("Error connecting to database.");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to permanently clear all records from the database?")) return;
    try {
      const res = await fetch(`${BASEURL}/api/scans`, {
        method: "DELETE",
      });
      if (res.ok) {
        setScans([]);
        toast.info("All audit records and certificates cleared from database.");
        setStats({ total_scans: 0, deepfakes_detected: 0, authentic_verified: 0, certificates_issued: 0 });
      }
    } catch {
      toast.error("Error clearing database.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>SQLite Forensic Evidence & Audit Store</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              Persistent DB Active
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-evident chain of custody log with cryptographic digests and multi-model inference records.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadDatabaseData}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition"
            title="Refresh database"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          {scans.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 text-xs transition"
            >
              <BsTrash3 className="w-3.5 h-3.5" />
              <span>Clear DB Records</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Database Analytics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[11px] font-mono uppercase">Total Audits Logged</div>
            <div className="text-2xl font-black text-white">{stats.total_scans}</div>
            <div className="text-[10px] text-slate-500">Stored in deepfake_forensics.db</div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[11px] font-mono uppercase">Deepfakes Flagged</div>
            <div className="text-2xl font-black text-rose-400">{stats.deepfakes_detected}</div>
            <div className="text-[10px] text-rose-400/80">Tampered / Synthetic</div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[11px] font-mono uppercase">Authentic Verified</div>
            <div className="text-2xl font-black text-emerald-400">{stats.authentic_verified}</div>
            <div className="text-[10px] text-emerald-400/80">Pristine human capture</div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[11px] font-mono uppercase">Certificates Issued</div>
            <div className="text-2xl font-black text-cyan-400">{stats.certificates_issued}</div>
            <div className="text-[10px] text-cyan-400/80">ISO 27037 Compliant</div>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <BsSearch className="absolute left-3 top-2.5 text-slate-500 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search by filename, hash, or verdict..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Media type filter buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {["all", "image", "video", "audio"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-medium uppercase transition ${
                selectedType === type
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Scans Table */}
      {scans.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
            <BsArchive className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-300">No Matching Audit Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload an image, video, or voice recording in the forensics studio to persist verification audits into the SQLite database.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">ID / Type</th>
                  <th className="px-5 py-3.5">Media Name</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Verdict & Category</th>
                  <th className="px-5 py-3.5">Authenticity</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scans.map((scan) => {
                  const isAuthentic = scan.result === 0;
                  const isFake = scan.result === 1;
                  const manipType = scan.details?.manipulation_type || (isFake ? "Deepfake" : "Authentic Media");

                  return (
                    <tr key={scan.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-slate-500">#{scan.id}</span>
                          {scan.media_type === "image" && <FiImage className="w-4 h-4 text-cyan-400" />}
                          {scan.media_type === "video" && <FiVideo className="w-4 h-4 text-indigo-400" />}
                          {scan.media_type === "audio" && <FiMic className="w-4 h-4 text-amber-400" />}
                          <span className="font-medium uppercase text-slate-300">{scan.media_type}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-200 max-w-[200px] truncate" title={scan.filename}>
                        <div>{scan.filename}</div>
                        {scan.sha256 && (
                          <div className="font-mono text-[10px] text-slate-500 truncate max-w-[150px]">
                            {scan.sha256}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400 whitespace-nowrap">
                        {scan.timestamp ? scan.timestamp.split("T")[0] + " " + scan.timestamp.split("T")[1]?.slice(0, 8) : "-"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold w-fit ${
                              isAuthentic
                                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                                : isFake
                                ? "bg-rose-950/60 text-rose-300 border border-rose-800/60"
                                : "bg-amber-950/60 text-amber-300 border border-amber-800/60"
                            }`}
                          >
                            {isAuthentic ? (
                              <BsShieldCheck className="w-3.5 h-3.5" />
                            ) : isFake ? (
                              <BsShieldX className="w-3.5 h-3.5" />
                            ) : (
                              <BsShieldExclamation className="w-3.5 h-3.5" />
                            )}
                            <span>{scan.verdict || scan.label}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 pl-1">{manipType}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-white text-sm">{scan.authenticity_score}%</span>
                        <div className="text-[10px] text-slate-500">Conf: {scan.confidence_percent}%</div>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() =>
                              onViewCertificate &&
                              onViewCertificate({
                                scan_id: scan.id,
                                filename: scan.filename,
                                media_type: scan.media_type,
                                verdict: scan.verdict || scan.label,
                                authenticity_score: scan.authenticity_score,
                                confidence_percent: scan.confidence_percent,
                                sha256: scan.sha256,
                                forensic_summary: scan.details,
                              })
                            }
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 hover:border-cyan-800/60 transition text-xs"
                            title="Generate/View Certificate"
                          >
                            <BsEye className="w-3.5 h-3.5" />
                            <span>Certificate</span>
                          </button>
                          <button
                            onClick={() => handleDeleteScan(scan.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 border border-slate-800 transition"
                            title="Delete scan record"
                          >
                            <BsTrash3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditHistory;
