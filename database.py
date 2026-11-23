import datetime
import json
from pathlib import Path
import sqlite3
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "deepfake_forensics.db"


def get_db_connection() -> sqlite3.Connection:
    """Creates a connection to the SQLite database with row factory enabled."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    """Initializes the database schema and indexes."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Media Scans table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS media_scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                filename TEXT NOT NULL,
                media_type TEXT NOT NULL,
                file_size_bytes INTEGER DEFAULT 0,
                sha256 TEXT,
                md5 TEXT,
                result INTEGER NOT NULL,
                label TEXT NOT NULL,
                confidence REAL DEFAULT 0.0,
                confidence_percent REAL DEFAULT 0.0,
                authenticity_score REAL DEFAULT 0.0,
                verdict TEXT,
                risk_level TEXT,
                details_json TEXT
            );
        """)

        # 2. Verification Certificates table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS verification_certificates (
                certificate_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                scan_id INTEGER,
                media_filename TEXT NOT NULL,
                media_type TEXT NOT NULL,
                sha256 TEXT,
                overall_verdict TEXT NOT NULL,
                authenticity_score REAL NOT NULL,
                confidence_rating TEXT,
                chain_of_custody_verified INTEGER DEFAULT 1,
                forensic_breakdown_json TEXT,
                certificate_payload_json TEXT,
                FOREIGN KEY (scan_id) REFERENCES media_scans (id) ON DELETE SET NULL
            );
        """)

        # 3. Human Expert Reviews table (Forensic Chain of Custody)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS expert_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scan_id INTEGER NOT NULL,
                reviewer_name TEXT NOT NULL,
                decision TEXT NOT NULL,
                notes TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (scan_id) REFERENCES media_scans (id) ON DELETE CASCADE
            );
        """)

        # 4. System Settings & ML Model Configuration table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        # Default settings if empty
        defaults = [
            ("model_mode", "ensemble"),
            ("sensitivity_preset", "balanced"),
            ("detection_threshold", "0.50"),
            ("ela_quality", "90"),
            ("auto_audit_logging", "true"),
        ]
        now_iso = datetime.datetime.utcnow().isoformat() + "Z"
        for k, v in defaults:
            cursor.execute("""
                INSERT OR IGNORE INTO system_settings (key, value, updated_at)
                VALUES (?, ?, ?);
            """, (k, v, now_iso))

        # Indexes for fast querying
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON media_scans(timestamp);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_sha256 ON media_scans(sha256);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_media_type ON media_scans(media_type);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_result ON media_scans(result);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cert_sha256 ON verification_certificates(sha256);")

        conn.commit()


def save_scan(scan_data: Dict[str, Any]) -> int:
    """Inserts a new media scan record and returns the assigned ID."""
    timestamp = scan_data.get("timestamp") or (datetime.datetime.utcnow().isoformat() + "Z")
    filename = scan_data.get("filename") or "unnamed_media"
    media_type = scan_data.get("media_type") or "image"
    file_size = scan_data.get("file_size_bytes") or 0
    sha256 = scan_data.get("sha256") or ""
    md5 = scan_data.get("md5") or ""
    result = int(scan_data.get("result", -1))
    label = scan_data.get("label") or "Unknown"
    confidence = float(scan_data.get("confidence") or 0.0)
    confidence_percent = float(scan_data.get("confidence_percent") or 0.0)
    authenticity_score = float(scan_data.get("authenticity_score") or 0.0)
    verdict = scan_data.get("verdict") or label
    risk_level = scan_data.get("risk_level") or "Unknown"

    # Separate raw details for JSON column
    details = scan_data.get("details") or {}
    details_str = json.dumps(details)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO media_scans (
                timestamp, filename, media_type, file_size_bytes, sha256, md5,
                result, label, confidence, confidence_percent, authenticity_score,
                verdict, risk_level, details_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            timestamp, filename, media_type, file_size, sha256, md5,
            result, label, confidence, confidence_percent, authenticity_score,
            verdict, risk_level, details_str
        ))
        conn.commit()
        return cursor.lastrowid


def get_scans(limit: int = 50, offset: int = 0, media_type: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves scans with pagination and optional search filter."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM media_scans WHERE 1=1"
        params: List[Any] = []

        if media_type and media_type != "all":
            query += " AND media_type = ?"
            params.append(media_type)

        if search:
            query += " AND (filename LIKE ? OR sha256 LIKE ? OR verdict LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])

        query += " ORDER BY id DESC LIMIT ? OFFSET ?;"
        params.extend([limit, offset])

        cursor.execute(query, params)
        rows = cursor.fetchall()

        results = []
        for r in rows:
            d = dict(r)
            if d.get("details_json"):
                try:
                    d["details"] = json.loads(d["details_json"])
                except Exception:
                    d["details"] = {}
            else:
                d["details"] = {}
            del d["details_json"]
            results.append(d)
        return results


def get_scan_by_id(scan_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single scan by ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM media_scans WHERE id = ?;", (scan_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        if d.get("details_json"):
            try:
                d["details"] = json.loads(d["details_json"])
            except Exception:
                d["details"] = {}
        else:
            d["details"] = {}
        del d["details_json"]
        return d


def delete_scan(scan_id: int) -> bool:
    """Deletes a scan record by ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM media_scans WHERE id = ?;", (scan_id,))
        conn.commit()
        return cursor.rowcount > 0


def clear_all_scans() -> bool:
    """Clears all scan records."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM media_scans;")
        cursor.execute("DELETE FROM verification_certificates;")
        cursor.execute("DELETE FROM expert_reviews;")
        conn.commit()
        return True


def save_certificate(cert_data: Dict[str, Any]) -> str:
    """Saves an issued forensic certificate."""
    cert_id = cert_data.get("certificate_id") or f"VERI-{datetime.date.today().year}"
    timestamp = cert_data.get("timestamp_utc") or (datetime.datetime.utcnow().isoformat() + "Z")
    scan_id = cert_data.get("scan_id")
    filename = cert_data.get("media_inspected") or "media_file"
    media_type = cert_data.get("media_type") or "image"
    sha256 = cert_data.get("sha256_checksum") or ""
    verdict = cert_data.get("overall_verdict") or "Audited"
    authenticity_score = float(cert_data.get("authenticity_score") or 0.0)
    confidence_rating = str(cert_data.get("confidence_rating") or "")
    breakdown_json = json.dumps(cert_data.get("forensic_breakdown") or {})
    payload_json = json.dumps(cert_data)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO verification_certificates (
                certificate_id, timestamp, scan_id, media_filename, media_type,
                sha256, overall_verdict, authenticity_score, confidence_rating,
                chain_of_custody_verified, forensic_breakdown_json, certificate_payload_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?);
        """, (
            cert_id, timestamp, scan_id, filename, media_type,
            sha256, verdict, authenticity_score, confidence_rating,
            breakdown_json, payload_json
        ))
        conn.commit()
        return cert_id


def get_certificate(certificate_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a verification certificate by ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM verification_certificates WHERE certificate_id = ?;", (certificate_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        if d.get("certificate_payload_json"):
            try:
                return json.loads(d["certificate_payload_json"])
            except Exception:
                pass
        return d


def add_expert_review(scan_id: int, reviewer_name: str, decision: str, notes: str) -> int:
    """Adds a human expert reviewer note/decision for chain of custody."""
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO expert_reviews (scan_id, reviewer_name, decision, notes, timestamp)
            VALUES (?, ?, ?, ?, ?);
        """, (scan_id, reviewer_name, decision, notes, timestamp))
        conn.commit()
        return cursor.lastrowid


def get_db_stats() -> Dict[str, Any]:
    """Computes summary statistics across all audited records."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM media_scans;")
        total_scans = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM media_scans WHERE result = 1;")
        deepfakes_detected = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM media_scans WHERE result = 0;")
        authentic_verified = cursor.fetchone()[0]

        cursor.execute("SELECT AVG(authenticity_score) FROM media_scans WHERE authenticity_score > 0;")
        avg_score_row = cursor.fetchone()[0]
        avg_score = round(float(avg_score_row), 1) if avg_score_row is not None else 0.0

        cursor.execute("SELECT COUNT(*) FROM verification_certificates;")
        certs_issued = cursor.fetchone()[0]

        cursor.execute("SELECT media_type, COUNT(*) FROM media_scans GROUP BY media_type;")
        by_type = {row[0]: row[1] for row in cursor.fetchall()}

        return {
            "total_scans": total_scans,
            "deepfakes_detected": deepfakes_detected,
            "authentic_verified": authentic_verified,
            "average_authenticity_score": avg_score,
            "certificates_issued": certs_issued,
            "breakdown_by_type": by_type,
        }


# Auto-initialize tables when imported
try:
    init_db()
except Exception as exc:
    print(f"Database initialization warning: {exc}")
