"use client";

import React, { useState, useMemo } from "react";
import { ForensicDocument, Institution, Role } from "@/lib/types";
import {
  FileSearch,
  Fingerprint,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CopyCheck,
  Eye,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
  Search,
  Copy,
  Check,
  Sparkles,
  Binary,
} from "lucide-react";

interface PdfForensicsViewProps {
  currentRole: Role;
  documents: ForensicDocument[];
  institutions: Institution[];
  onUploadDocument?: (docData: unknown) => Promise<void>;
  onRefreshState?: () => Promise<void>;
}

export const PdfForensicsView: React.FC<PdfForensicsViewProps> = ({
  currentRole,
  documents,
  institutions,
  onUploadDocument,
  onRefreshState,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<ForensicDocument | null>(
    documents.length > 0 ? documents[0] : null
  );
  const [comparisonTargetId, setComparisonTargetId] = useState<string>(
    documents.length > 1 ? documents[1].id : ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSha, setCopiedSha] = useState(false);

  const comparisonDoc = documents.find((d) => d.id === comparisonTargetId);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter(
      (d) =>
        d.fileName.toLowerCase().includes(q) ||
        (d.studentName && d.studentName.toLowerCase().includes(q)) ||
        d.id.toLowerCase().includes(q)
    );
  }, [documents, searchQuery]);

  // Analytics counts
  const exactDuplicates = documents.filter((d) =>
    d.findings.some((f) => f.type === "EXACT_DUPLICATE")
  ).length;
  const alteredTemplates = documents.filter((d) =>
    d.findings.some((f) => f.type === "TEXT_TAMPER_SUSPECTED")
  ).length;
  const perceptualSimilar = documents.filter((d) =>
    d.findings.some((f) => f.type === "PERCEPTUAL_SIMILARITY")
  ).length;

  const getFindingBadge = (type: ForensicDocument["findings"][0]["type"]) => {
    switch (type) {
      case "EXACT_DUPLICATE":
        return {
          label: "Exact Byte Duplicate (SHA-256 Collision)",
          bg: "bg-red-50 text-red-700 border-red-200",
          icon: XCircle,
        };
      case "TEXT_TAMPER_SUSPECTED":
        return {
          label: "Template Spoof / Text Altered",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: AlertTriangle,
        };
      case "PERCEPTUAL_SIMILARITY":
        return {
          label: "Visual Rescan / Similar Layout (pHash)",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: Layers,
        };
      case "METADATA_ANOMALY":
        return {
          label: "Metadata Timestamp Inconsistency",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          icon: Clock,
        };
      case "CLEAN":
      default:
        return {
          label: "Authentic & Clean Record",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
        };
    }
  };

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold text-[#0B1B3D] tracking-tight">
              PDF Digital Forensics & Document Anomaly Detection
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200/80 shadow-xs">
              <Binary className="w-3.5 h-3.5 text-purple-600" />
              pHash & Byte Forensics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Detect exact duplicate supporting certificates, layout cloning, font manipulation, and cross-institutional document reuse.
          </p>
        </div>
      </div>

      {/* Forensic Intelligence Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Total Scanned PDFs
          </div>
          <div className="text-2xl font-black text-[#0B1B3D] mt-1">{documents.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ingested across all institutions</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-600">
            Exact SHA-256 Clones
          </div>
          <div className="text-2xl font-black text-red-600 mt-1">{exactDuplicates}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Byte-for-byte identical files</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
            Template Reused / Altered
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{alteredTemplates}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Same certificate, edited text</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E5AE6]">
            Perceptual Match (pHash)
          </div>
          <div className="text-2xl font-black text-[#1E5AE6] mt-1">{perceptualSimilar}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Visual layout similarity &gt; 90%</div>
        </div>
      </div>

      {/* Main Grid: Document Gallery on Left (1 col), Forensic Workspace on Right (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Document Gallery */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileSearch className="w-4 h-4 text-purple-600" />
              Scanned Artifacts ({documents.length})
            </h2>
            <span className="text-[10px] font-bold text-slate-400">Forensic Index</span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search PDF file or student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

          {/* Artifact List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredDocs.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              const hasCritical = doc.findings.some(
                (f) => f.type === "EXACT_DUPLICATE" || f.type === "TEXT_TAMPER_SUSPECTED"
              );

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/20 shadow-sm"
                      : "bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {doc.id}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${
                        hasCritical
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {doc.reviewStatus}
                    </span>
                  </div>

                  <div className="mt-1.5 font-bold text-xs text-[#0B1B3D] truncate">
                    {doc.fileName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    Student: {doc.studentName || "Unassigned"}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 font-mono text-[10px] text-slate-400 truncate flex items-center justify-between">
                    <span>pHash: {doc.perceptualHash}</span>
                    <span>{(doc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Forensic Inspector & Side-by-Side Diff */}
        {selectedDoc ? (
          <div className="lg:col-span-2 space-y-5">
            {/* Primary Document Dossier Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    Forensic Examination Record: {selectedDoc.id}
                  </span>
                  <h2 className="text-lg font-black text-[#0B1B3D] mt-1.5">
                    {selectedDoc.fileName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Associated Student: <strong className="text-slate-800">{selectedDoc.studentName || "Unassigned"}</strong> • File Size: {(selectedDoc.fileSizeBytes / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Perceptual Layout Hash
                  </span>
                  <span className="text-xs font-mono font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 inline-block mt-1">
                    {selectedDoc.perceptualHash}
                  </span>
                </div>
              </div>

              {/* Cryptographic Hashes Details */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Full SHA-256 Cryptographic Hash:
                  </span>
                  <button
                    onClick={() => handleCopySha(selectedDoc.fileSha256)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 flex items-center gap-1 text-[10px]"
                  >
                    {copiedSha ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSha ? "Copied" : "Copy Hash"}</span>
                  </button>
                </div>
                <div className="font-mono text-xs font-bold text-[#0B1B3D] break-all bg-white p-2.5 rounded-lg border border-slate-200">
                  {selectedDoc.fileSha256}
                </div>

                <div className="pt-1.5 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60">
                  <span>PDF Engine / Producer: <strong>{selectedDoc.metadata.producer || "N/A"}</strong></span>
                  <span>Created: <strong>{selectedDoc.metadata.creationDate || "N/A"}</strong></span>
                </div>
              </div>

              {/* Forensic Findings */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  Forensic Detection Findings ({selectedDoc.findings.length})
                </h3>

                <div className="space-y-2.5">
                  {selectedDoc.findings.map((f, idx) => {
                    const meta = getFindingBadge(f.type);
                    const FindingIcon = meta.icon;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${meta.bg}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold flex items-center gap-1.5 text-xs">
                            <FindingIcon className="w-4 h-4" />
                            {meta.label}
                          </span>
                          {f.similarityScore && (
                            <span className="font-mono font-bold bg-white/70 px-2 py-0.5 rounded text-[10px]">
                              Similarity: {f.similarityScore}%
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed pt-0.5">
                          {f.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Workspace */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0B1B3D] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Side-by-Side Document Comparison & OCR Text Diff
                </h3>
                <select
                  aria-label="Select Target Document for Comparison"
                  value={comparisonTargetId}
                  onChange={(e) => setComparisonTargetId(e.target.value)}
                  className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="">Compare with another PDF...</option>
                  {documents
                    .filter((d) => d.id !== selectedDoc.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fileName} ({d.studentName})
                      </option>
                    ))}
                </select>
              </div>

              {comparisonDoc ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Doc 1 Extracted Text */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                    <div className="font-extrabold text-[#0B1B3D] pb-1.5 border-b border-slate-200 truncate flex items-center justify-between">
                      <span className="truncate">{selectedDoc.fileName}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">Doc A</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 p-3 bg-white rounded-lg border border-slate-200 max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                      {selectedDoc.extractedText}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                      <span>pHash: {selectedDoc.perceptualHash}</span>
                      <span>SHA: {selectedDoc.fileSha256.slice(0, 12)}...</span>
                    </div>
                  </div>

                  {/* Doc 2 Extracted Text */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                    <div className="font-extrabold text-[#0B1B3D] pb-1.5 border-b border-slate-200 truncate flex items-center justify-between">
                      <span className="truncate">{comparisonDoc.fileName}</span>
                      <span className="text-[10px] text-purple-700 font-mono shrink-0">Doc B</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 p-3 bg-white rounded-lg border border-slate-200 max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                      {comparisonDoc.extractedText}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                      <span>pHash: {comparisonDoc.perceptualHash}</span>
                      <span>SHA: {comparisonDoc.fileSha256.slice(0, 12)}...</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Select a second document in the dropdown above to inspect side-by-side text and perceptual layout difference.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs">
            Select a document on the left to inspect forensic findings.
          </div>
        )}
      </div>
    </div>
  );
};
