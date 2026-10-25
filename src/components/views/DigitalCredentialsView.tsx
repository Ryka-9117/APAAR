"use client";

import React, { useState, useMemo } from "react";
import { StudentCredential, Institution, Role } from "@/lib/types";
import { QrCodeView } from "../QrCodeView";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  QrCode,
  AlertTriangle,
  Lock,
  Building,
  GraduationCap,
  X,
  Search,
  Copy,
  ExternalLink,
  Sparkles,
  FileBadge2,
  Check,
} from "lucide-react";

interface DigitalCredentialsViewProps {
  currentRole: Role;
  credentials: StudentCredential[];
  institutions: Institution[];
  onRevokeCredential?: (credentialId: string, reason: string) => Promise<void>;
  onNavigateTab?: (tab: string) => void;
}

export const DigitalCredentialsView: React.FC<DigitalCredentialsViewProps> = ({
  currentRole,
  credentials,
  institutions,
  onRevokeCredential,
  onNavigateTab,
}) => {
  const [selectedCred, setSelectedCred] = useState<StudentCredential | null>(
    credentials.length > 0 ? credentials[0] : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ISSUED" | "REVOKED">("ALL");
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedSig, setCopiedSig] = useState(false);

  // Filter credentials list
  const filteredCredentials = useMemo(() => {
    return credentials.filter((cred) => {
      if (statusFilter !== "ALL" && cred.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        cred.credentialNumber.toLowerCase().includes(q) ||
        cred.payload.studentName.toLowerCase().includes(q) ||
        cred.payload.courseName.toLowerCase().includes(q) ||
        cred.payload.maskedApaar.toLowerCase().includes(q)
      );
    });
  }, [credentials, searchQuery, statusFilter]);

  const handleExecuteRevoke = async () => {
    if (!selectedCred || !onRevokeCredential || !revokeReason.trim()) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onRevokeCredential(selectedCred.id, revokeReason.trim());
      setFeedback(`Credential #${selectedCred.credentialNumber} has been revoked and recorded in the audit trail.`);
      setShowRevokeModal(false);
      setRevokeReason("");
    } catch {
      setFeedback("Failed to revoke credential.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySignature = () => {
    if (!selectedCred) return;
    navigator.clipboard.writeText(selectedCred.signature.signatureHex);
    setCopiedSig(true);
    setTimeout(() => setCopiedSig(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold text-[#0B1B3D] tracking-tight">
              Digitally Signed Academic Credentials
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs">
              <Lock className="w-3 h-3 text-teal-600" />
              HMAC-SHA256 Cryptographic Proof
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident student academic credentials issued with server-side digital signatures, public QR verification, and automated audit ledger logging.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Certificate
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Directory on Left (1 col) and Certificate Workspace on Right (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Credentials Directory Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <FileBadge2 className="w-3.5 h-3.5 text-[#1E5AE6]" />
              Registry Credentials ({credentials.length})
            </h2>
            <span className="text-[10px] font-bold text-slate-400">AY 2024-25</span>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search credential #, student, course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5AE6]/20 focus:border-[#1E5AE6] transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              {(["ALL", "ISSUED", "REVOKED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                    statusFilter === filter
                      ? "bg-[#0B1B3D] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Credential List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredCredentials.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No credentials matching your query.
              </div>
            ) : (
              filteredCredentials.map((cred) => {
                const isSelected = selectedCred?.id === cred.id;
                const isRevoked = cred.status === "REVOKED";

                return (
                  <div
                    key={cred.id}
                    onClick={() => setSelectedCred(cred)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/70 border-[#1E5AE6] ring-2 ring-[#1E5AE6]/20 shadow-sm"
                        : "bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-xs font-extrabold text-slate-800">
                        {cred.credentialNumber}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${
                          isRevoked
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {cred.status}
                      </span>
                    </div>

                    <div className="mt-1.5 font-bold text-xs text-[#0B1B3D]">
                      {cred.payload.studentName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {cred.payload.courseName}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-200/60">
                      <span>APAAR: {cred.payload.maskedApaar}</span>
                      <span>{cred.issueDate.slice(0, 10)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Certificate Preview and QR Verification Details */}
        {selectedCred ? (
          <div className="lg:col-span-2 space-y-4">
            {/* The Formal Sovereign Certificate Card */}
            <div className="bg-white rounded-2xl border-4 border-[#0B1B3D] p-6 sm:p-9 shadow-premium relative overflow-hidden print:border-2 print:shadow-none">
              {/* Outer decorative golden/navy concentric border inset */}
              <div className="absolute inset-1.5 border border-[#D97706]/40 pointer-events-none rounded-xl" />

              {/* Watermark seal */}
              <div className="absolute right-6 bottom-6 opacity-4 pointer-events-none select-none text-[#0B1B3D]">
                <ShieldCheck className="w-72 h-72" />
              </div>

              {/* Revoked watermark stamp if revoked */}
              {selectedCred.status === "REVOKED" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="transform -rotate-24 border-8 border-red-600/60 rounded-3xl px-10 py-4 text-center">
                    <span className="font-extrabold text-5xl tracking-widest text-red-600/70 uppercase font-mono block">
                      REVOKED
                    </span>
                    <span className="text-xs font-bold text-red-700/80 tracking-wide uppercase mt-1 block">
                      AICTE Regulatory Invalidation
                    </span>
                  </div>
                </div>
              )}

              {/* Certificate Header */}
              <div className="text-center pb-6 border-b-2 border-slate-200/80 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[10px] uppercase font-extrabold tracking-widest text-[#0B1B3D] mb-2">
                  <Award className="w-3.5 h-3.5 text-[#D97706]" />
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION • NEW DELHI
                </div>
                <h2 className="text-2xl font-black text-[#0B1B3D] tracking-tight uppercase font-serif mt-1">
                  National Digital Academic Credential
                </h2>
                <p className="text-[11px] font-bold tracking-wider uppercase text-[#1E5AE6] mt-0.5">
                  VIDYA SETU • APAR STUDENT IDENTITY FRAMEWORK
                </p>
                <div className="text-xs font-mono text-slate-500 mt-2 bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-200">
                  Credential Reference: <strong className="text-slate-800">{selectedCred.credentialNumber}</strong>
                </div>
              </div>

              {/* Certificate Body */}
              <div className="my-8 space-y-4 text-center relative z-10">
                <p className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                  This is to certify that
                </p>

                <div className="text-3xl font-black text-[#0B1B3D] tracking-tight font-serif py-1">
                  {selectedCred.payload.studentName}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-600">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold">
                    APAAR ID: <strong className="text-slate-900">{selectedCred.payload.maskedApaar}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold">
                    Institutional ID: <strong className="text-slate-900">{selectedCred.payload.institutionalStudentId}</strong>
                  </span>
                </div>

                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed pt-2">
                  has been officially admitted and verified under AICTE National Standards and successfully registered in the approved programme
                </p>

                <div className="text-lg font-extrabold text-[#1E5AE6] tracking-wide">
                  {selectedCred.payload.courseName}
                </div>

                <div className="text-xs font-bold text-slate-700 bg-blue-50/60 inline-block px-4 py-1.5 rounded-xl border border-blue-100">
                  {selectedCred.payload.institutionName} • Academic Year {selectedCred.payload.academicYear}
                </div>
              </div>

              {/* Certificate Footer with QR Code & Signature Details */}
              <div className="mt-8 pt-6 border-t-2 border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center relative z-10">
                {/* QR Section */}
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl border-2 border-slate-200 shadow-xs shrink-0">
                    <QrCodeView
                      value={`${typeof window !== "undefined" ? window.location.origin : "https://vidya-setu.aicte-india.org"}/verify?cred=${selectedCred.id}`}
                      size={96}
                    />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <span className="font-extrabold text-[#0B1B3D] block text-xs">
                      Public QR Authenticity Seal
                    </span>
                    <p className="text-[10px] leading-snug text-slate-500">
                      Scan or tap to verify cryptographic signature without revealing personal identity.
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md ${
                          selectedCred.status === "REVOKED"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {selectedCred.status === "REVOKED" ? (
                          <XCircle className="w-3 h-3 text-red-600" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        )}
                        Status: {selectedCred.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Digital Signature Details */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 text-right space-y-1.5 text-xs">
                  <div className="flex items-center justify-end gap-1.5 text-[#0B1B3D] font-extrabold text-xs">
                    <Lock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Cryptographic HMAC-SHA256</span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <span className="font-mono text-[10px] text-slate-600 truncate max-w-[220px]">
                      {selectedCred.signature.signatureHex.slice(0, 24)}...
                    </span>
                    <button
                      onClick={handleCopySignature}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                      title="Copy full cryptographic signature"
                    >
                      {copiedSig ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Key Authority: <strong>{selectedCred.signature.keyId}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Signed: {selectedCred.signature.timestamp.slice(0, 19).replace("T", " ")} UTC
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("verify");
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#1E5AE6] hover:bg-blue-700 text-white flex items-center gap-2 shadow-xs transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  Test Verification Gateway
                </button>

                <button
                  onClick={handleCopySignature}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {copiedSig ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  {copiedSig ? "Signature Copied" : "Copy Signature"}
                </button>
              </div>

              {currentRole === "AICTE_ADMIN" && selectedCred.status !== "REVOKED" && (
                <button
                  onClick={() => setShowRevokeModal(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Revoke Credential
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            Select a credential on the left to inspect and view the certificate.
          </div>
        )}
      </div>

      {/* Revocation Modal */}
      {showRevokeModal && selectedCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Revoke Academic Credential
              </h3>
              <button
                onClick={() => setShowRevokeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Revoking credential <strong className="text-slate-800">{selectedCred.credentialNumber}</strong> will immediately invalidate all QR verifications and employer access tokens. This action is permanently recorded in the SHA-256 audit ledger.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Regulatory Reason:
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Specify regulatory ground (e.g. Identity anomaly, duplicate admission conflict, student withdrawal)..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 h-24 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRevoke}
                disabled={isSubmitting || !revokeReason.trim()}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
