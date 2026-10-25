"use client";

import React, { useState } from "react";
import { StudentCredential, Role } from "@/lib/types";
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Search,
  Building,
  GraduationCap,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  Shield,
  FileCheck2,
} from "lucide-react";

interface PublicVerifyViewProps {
  currentRole: Role;
  credentials: StudentCredential[];
  initialCredId?: string;
}

export const PublicVerifyView: React.FC<PublicVerifyViewProps> = ({
  currentRole,
  credentials,
  initialCredId,
}) => {
  const [queryId, setQueryId] = useState(initialCredId || "CRED-VS-2024-9842");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    status: string;
    message?: string;
    credentialNumber?: string;
    issuingInstitution?: string;
    programme?: string;
    academicYear?: string;
    issueDate?: string;
    revokedAt?: string;
    revocationReason?: string;
    signatureAlgorithm?: string;
    verificationTimestamp?: string;
  } | null>(null);

  const handleVerify = async (idToVerify?: string) => {
    const target = idToVerify || queryId;
    if (!target.trim()) return;
    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const res = await fetch("/api/credentials/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: target.trim() }),
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch (e) {
      console.error(e);
      setVerifyResult({
        verified: false,
        status: "ERROR",
        message: "Failed to connect to AICTE Verification Service.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with National Trust Anchor Branding */}
      <div className="text-center pb-6 border-b border-slate-200/80">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#1E5AE6] flex items-center justify-center mx-auto mb-3 shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[#0B1B3D] text-[10px] font-extrabold uppercase tracking-widest mb-2 border border-slate-200">
          <Shield className="w-3 h-3 text-[#1E5AE6]" />
          AICTE Root Cryptographic Authority
        </div>
        <h1 className="text-2xl font-black text-[#0B1B3D] tracking-tight">
          Public Academic Credential Verification Gateway
        </h1>
        <p className="text-xs text-slate-500 mt-1.5 max-w-xl mx-auto leading-relaxed">
          Verify digital credentials issued across AICTE approved technical universities. Instant cryptographic signature resolution with guaranteed privacy and zero PII disclosure.
        </p>
      </div>

      {/* Trust Guarantee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#0B1B3D] block">Zero PII Leakage</span>
            <span className="text-[10px] text-slate-400">Personal data strictly masked</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1E5AE6] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#0B1B3D] block">HMAC-SHA256 Signed</span>
            <span className="text-[10px] text-slate-400">Server verified root anchor</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#0B1B3D] block">Real-time Revocation</span>
            <span className="text-[10px] text-slate-400">Immediate ledger invalidation</span>
          </div>
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card space-y-4">
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
            Enter Credential Reference ID or QR String:
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                placeholder="e.g. CRED-VS-2024-9842"
                className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5AE6]/20 focus:border-[#1E5AE6] transition-all"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={isVerifying || !queryId.trim()}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-[#1E5AE6] hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              {isVerifying ? "Verifying Root Signature..." : "Verify Credential"}
            </button>
          </div>
        </div>

        {/* Quick Test Demo Scenarios */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-500">Test Canonical Scenarios:</span>
          <button
            onClick={() => {
              setQueryId("CRED-VS-2024-9842");
              handleVerify("CRED-VS-2024-9842");
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-[11px] transition-colors"
          >
            Valid Active (Aarav Sharma)
          </button>
          <button
            onClick={() => {
              setQueryId("CRED-VS-2024-4444");
              handleVerify("CRED-VS-2024-4444");
            }}
            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold text-[11px] transition-colors"
          >
            Revoked Invalidation (Karan Verma)
          </button>
          <button
            onClick={() => {
              setQueryId("CRED-INVALID-TAMPERED-9999");
              handleVerify("CRED-INVALID-TAMPERED-9999");
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-bold text-[11px] transition-colors"
          >
            Tampered Non-Existent ID
          </button>
        </div>
      </div>

      {/* Verification Result Card */}
      {verifyResult && (
        <div
          className={`bg-white rounded-2xl border-2 p-6 sm:p-8 shadow-premium transition-all animate-in fade-in ${
            verifyResult.verified
              ? "border-emerald-500 ring-4 ring-emerald-50"
              : verifyResult.status === "REVOKED"
              ? "border-red-500 ring-4 ring-red-50"
              : "border-amber-500 ring-4 ring-amber-50"
          }`}
        >
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  verifyResult.verified
                    ? "bg-emerald-100 text-emerald-700"
                    : verifyResult.status === "REVOKED"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {verifyResult.verified ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : verifyResult.status === "REVOKED" ? (
                  <XCircle className="w-8 h-8" />
                ) : (
                  <AlertTriangle className="w-8 h-8" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-black text-[#0B1B3D] tracking-tight">
                    {verifyResult.verified
                      ? "Authentic & Verified Academic Credential"
                      : verifyResult.status === "REVOKED"
                      ? "Credential Invalidation Notice"
                      : "Verification Failed / Tamper Warning"}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      verifyResult.verified
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {verifyResult.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {verifyResult.message || "Valid HMAC-SHA256 digital signature verified against AICTE root authority."}
                </p>
              </div>
            </div>
          </div>

          {/* Minimal Public Verification Details (Privacy-preserving: No sensitive PII!) */}
          {verifyResult.issuingInstitution && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Issuing AICTE Approved Campus:
                </span>
                <span className="font-extrabold text-slate-900 text-sm block">
                  {verifyResult.issuingInstitution}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Sanctioned Programme:
                </span>
                <span className="font-extrabold text-[#1E5AE6] text-sm block">
                  {verifyResult.programme}
                </span>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Academic Year:
                </span>
                <span className="font-bold text-slate-800">
                  {verifyResult.academicYear}
                </span>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Credential Reference Number:
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {verifyResult.credentialNumber}
                </span>
              </div>

              {verifyResult.revokedAt && (
                <div className="sm:col-span-2 pt-3 border-t border-red-200 text-red-800 bg-red-50/60 p-3 rounded-xl mt-1">
                  <span className="font-extrabold uppercase text-[10px] tracking-wider block text-red-900">
                    Regulatory Revocation Grounds:
                  </span>
                  <div className="font-semibold text-xs mt-0.5">{verifyResult.revocationReason}</div>
                  <span className="block text-[10px] text-red-600 font-mono mt-1">
                    Revocation Recorded: {verifyResult.revokedAt}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Proof Details */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              <span className="font-mono text-[11px]">
                Algorithm: <strong className="text-slate-800">{verifyResult.signatureAlgorithm || "HMAC-SHA256"}</strong>
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              Verified At: {verifyResult.verificationTimestamp ? verifyResult.verificationTimestamp.slice(0, 19).replace("T", " ") : new Date().toISOString().slice(0, 19).replace("T", " ")} UTC
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
