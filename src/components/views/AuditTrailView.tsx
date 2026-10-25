"use client";

import React, { useState } from "react";
import { AuditEvent, Role } from "@/lib/types";
import {
  History,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Lock,
  ArrowRight,
  Sliders,
  FileCode,
  Layers,
  Copy,
  Check,
  Sparkles,
  Link2,
} from "lucide-react";

interface AuditTrailViewProps {
  currentRole: Role;
  auditEvents: AuditEvent[];
  isTamperActive: boolean;
  onRefreshState?: () => Promise<void>;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  currentRole,
  auditEvents,
  isTamperActive,
  onRefreshState,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(
    auditEvents.length > 0 ? auditEvents[0] : null
  );
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    totalChecked: number;
    lastVerifiedTimestamp: string;
    firstMismatchIndex?: number;
    mismatchDetails?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSimulatingTamper, setIsSimulatingTamper] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY" }),
      });
      const data = await res.json();
      if (data.verification) {
        setVerificationResult(data.verification);
        if (data.verification.isValid) {
          setFeedback(
            "Cryptographic Hash-Chain is 100% Authentic and Valid. All SHA-256 blocks verified from Genesis to Head."
          );
        } else {
          setFeedback(`HASH-CHAIN TAMPERING DETECTED! ${data.verification.mismatchDetails}`);
        }
      }
    } catch {
      setFeedback("Failed to execute hash-chain verification.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleTamper = async (simulate: boolean) => {
    setIsSimulatingTamper(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: simulate ? "SIMULATE_TAMPER" : "RESTORE_TAMPER",
        }),
      });
      const data = await res.json();
      if (data.verification) {
        setVerificationResult(data.verification);
      }
      if (onRefreshState) await onRefreshState();

      if (simulate) {
        setFeedback(
          "DEMO TAMPER SIMULATION TRIGGERED: Block #4 payload was silently modified. Run 'Verify Hash Chain Integrity' to observe cryptographic detection."
        );
      } else {
        setFeedback("Chain restored to authentic state. Hash-chain integrity re-established.");
      }
    } catch {
      setFeedback("Failed to update tamper simulation.");
    } finally {
      setIsSimulatingTamper(false);
    }
  };

  const handleCopyCurrentHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold text-[#0B1B3D] tracking-tight">
              Tamper-Evident Regulatory Audit Trail
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1E5AE6] border border-blue-200/80 shadow-xs">
              <Link2 className="w-3.5 h-3.5 text-[#1E5AE6]" />
              SHA-256 Chained Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sequential cryptographically linked blocks capturing all regulatory decisions, admissions, and verifications with mathematical tamper resistance.
          </p>
        </div>

        {/* Verification and Tamper Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#1E5AE6] hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {isVerifying ? "Verifying Hash Chain..." : "Verify Hash Chain Integrity"}
          </button>

          {isTamperActive ? (
            <button
              onClick={() => handleToggleTamper(false)}
              disabled={isSimulatingTamper}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restore Authentic Chain
            </button>
          ) : (
            <button
              onClick={() => handleToggleTamper(true)}
              disabled={isSimulatingTamper}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-xs flex items-center gap-2 transition-colors"
              title="Demo test: Silently modifies an earlier audit entry to demonstrate cryptographic detection"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              Simulate Log Tampering
            </button>
          )}
        </div>
      </div>

      {/* Ledger Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Total Blocks
          </div>
          <div className="text-2xl font-black text-[#0B1B3D] mt-1">{auditEvents.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sequenced events</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Ledger Anchor
          </div>
          <div className="text-xs font-mono font-black text-slate-700 mt-2 truncate">
            0000000000000000...
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Genesis Block #1</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Chain State
          </div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                isTamperActive
                  ? "bg-red-100 text-red-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isTamperActive ? (
                <>
                  <XCircle className="w-3.5 h-3.5" /> Tampered
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authentic
                </>
              )}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {isTamperActive ? "Demo breach active" : "100% cryptographic seal"}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Hash Standard
          </div>
          <div className="text-base font-black text-[#1E5AE6] mt-1">FIPS 180-4</div>
          <div className="text-[10px] text-slate-500 mt-0.5">SHA-256 Digest</div>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in ${
            verificationResult.isValid
              ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
              : "bg-red-50/90 border-red-300 text-red-950 ring-4 ring-red-100"
          }`}
        >
          <div className="flex items-start gap-3.5">
            {verificationResult.isValid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-black text-sm uppercase tracking-wide block">
                {verificationResult.isValid
                  ? "Cryptographic Hash-Chain Integrity Verified"
                  : "Cryptographic Tamper Mismatch Detected — Chain Broken!"}
              </span>
              <p className="text-xs mt-1 leading-relaxed">
                {verificationResult.isValid
                  ? `Successfully validated all ${verificationResult.totalChecked} sequenced events from Genesis block to head. No modifications or link breaks detected.`
                  : verificationResult.mismatchDetails}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0 bg-white/70 px-3 py-1 rounded-lg border border-slate-200">
            {verificationResult.lastVerifiedTimestamp.slice(11, 19)} UTC
          </span>
        </div>
      )}

      {/* Main Grid: Hash-Chained Events Table & Block Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Events Sequence Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <History className="w-4 h-4 text-[#1E5AE6]" />
              Chained Events Sequence ({auditEvents.length} Blocks)
            </span>
            <span className="text-[10px] font-mono text-slate-500">Genesis: 00000000...</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 border-b border-slate-200/80 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 w-16">Block #</th>
                  <th className="py-3 px-3.5">Timestamp</th>
                  <th className="py-3 px-3.5">Actor & Role</th>
                  <th className="py-3 px-3.5">Action Type</th>
                  <th className="py-3 px-3.5">Target Entity</th>
                  <th className="py-3 px-3.5">Current Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditEvents.map((evt) => {
                  const isSelected = selectedEvent?.id === evt.id;
                  const isTamperedBlock = isTamperActive && evt.eventNumber === 4;

                  return (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`cursor-pointer transition-colors ${
                        isTamperedBlock
                          ? "bg-red-50/80 hover:bg-red-100/80 ring-1 ring-inset ring-red-300"
                          : isSelected
                          ? "bg-blue-50/70 hover:bg-blue-50/90 ring-1 ring-inset ring-[#1E5AE6]/40"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3 px-3.5 font-mono font-black text-slate-700">
                        #{evt.eventNumber}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500">
                        {evt.timestamp.slice(0, 10)}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-extrabold text-[#0B1B3D] block truncate max-w-[140px]">
                          {evt.actorName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{evt.actorRole}</span>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-800">
                        {evt.actionType}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 text-[11px]">
                        {evt.targetEntity}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[10px] text-slate-500">
                        {evt.currentHash.slice(0, 12)}...
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Block Inspector */}
        {selectedEvent ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1E5AE6] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Block #{selectedEvent.eventNumber} • {selectedEvent.id}
                </span>
                <h2 className="text-sm font-black text-[#0B1B3D] mt-1.5">
                  {selectedEvent.actionType}
                </h2>
                <p className="text-xs text-slate-500">
                  Actor: <strong className="text-slate-800">{selectedEvent.actorName}</strong> ({selectedEvent.actorRole})
                </p>
              </div>
            </div>

            {/* Cryptographic Link Verification */}
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-sans text-[10px] uppercase font-extrabold text-slate-500 block">
                  Parent Link (Previous Block Hash):
                </span>
                <div className="text-[11px] text-slate-700 break-all">
                  {selectedEvent.previousHash}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[10px] uppercase font-extrabold text-[#1E5AE6] block">
                    Current Block SHA-256 Hash:
                  </span>
                  <button
                    onClick={() => handleCopyCurrentHash(selectedEvent.currentHash)}
                    className="p-1 hover:bg-blue-100 rounded text-blue-700 font-sans text-[10px] flex items-center gap-1"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="text-[11px] font-black text-[#0B1B3D] break-all">
                  {selectedEvent.currentHash}
                </div>
              </div>
            </div>

            {/* Event Canonical Payload */}
            <div className="space-y-1.5 text-xs">
              <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] block">
                Canonical Payload JSON:
              </span>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-52 leading-relaxed border border-slate-800 shadow-inner">
                {JSON.stringify(
                  {
                    targetEntity: selectedEvent.targetEntity,
                    targetReference: selectedEvent.targetReference,
                    result: selectedEvent.result,
                    metadata: selectedEvent.metadata,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
            Select a block on the left to inspect cryptographic proof.
          </div>
        )}
      </div>
    </div>
  );
};
