"use client";

import React, { useState } from "react";
import { ConsentRequest, StudentCredential, Role } from "@/lib/types";
import {
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Clock,
  ArrowRight,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";

interface EmployerConsentViewProps {
  currentRole: Role;
  consentRequests: ConsentRequest[];
  credentials: StudentCredential[];
  onRefreshState?: () => Promise<void>;
}

export const EmployerConsentView: React.FC<EmployerConsentViewProps> = ({
  currentRole,
  consentRequests,
  credentials,
  onRefreshState,
}) => {
  const [selectedRequest, setSelectedRequest] = useState<ConsentRequest | null>(
    consentRequests.length > 0 ? consentRequests[0] : null
  );

  // Employer initiate form state
  const [targetCredId, setTargetCredId] = useState(
    credentials.length > 0 ? credentials[0].id : "CRED-VS-2024-9842"
  );
  const [employerName, setEmployerName] = useState(
    "Tata Consultancy Services — Background Verification Directorate"
  );
  const [purpose, setPurpose] = useState(
    "Pre-employment verification of academic credentials and AICTE enrolment authenticity"
  );
  const [isInitiating, setIsInitiating] = useState(false);

  // Student OTP approve state
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Employer token query state
  const [queryToken, setQueryToken] = useState("");
  const [tokenResult, setTokenResult] = useState<Record<string, unknown> | null>(null);
  const [isQueryingToken, setIsQueryingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleInitiateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInitiating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          credentialId: targetCredId,
          requestingEmployer: employerName,
          purpose,
          requestedFields: ["courseName", "academicYear", "completionStatus", "institutionName"],
        }),
      });
      const data = await res.json();
      if (data.consentRequest) {
        setSelectedRequest(data.consentRequest);
        setFeedback("Consent request successfully created and routed to the Student Portal!");
        if (onRefreshState) await onRefreshState();
      }
    } catch {
      setFeedback("Failed to initiate consent request.");
    } finally {
      setIsInitiating(false);
    }
  };

  const handleRespond = async (approved: boolean) => {
    if (!selectedRequest) return;
    setIsResponding(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESPOND",
          requestId: selectedRequest.id,
          approved,
          otp: enteredOtp,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(
          approved
            ? `Consent approved! Single-use verification token: ${data.verificationToken}`
            : "Consent request has been declined."
        );
        if (data.verificationToken) {
          setQueryToken(data.verificationToken);
        }
        if (onRefreshState) await onRefreshState();
      } else {
        setFeedback(data.error || "Failed to submit response.");
      }
    } catch {
      setFeedback("Error responding to consent challenge.");
    } finally {
      setIsResponding(false);
    }
  };

  const handleQueryToken = async () => {
    if (!queryToken.trim()) return;
    setIsQueryingToken(true);
    setTokenResult(null);
    try {
      const res = await fetch(`/api/consent?token=${encodeURIComponent(queryToken.trim())}`);
      const data = await res.json();
      setTokenResult(data);
    } catch {
      setTokenResult({ error: "Failed to resolve token." });
    } finally {
      setIsQueryingToken(false);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold text-[#0B1B3D] tracking-tight">
              Consent-Based Employer Verification
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs">
              <Lock className="w-3 h-3 text-teal-600" />
              DPDP Act & Privacy Preserving
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Zero-knowledge, purpose-restricted verification journey where employers request specific attributes and students grant time-limited tokens via simulated OTP challenge.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-medium text-[#1E5AE6] flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1E5AE6]" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-blue-700 hover:text-blue-900">
            &times;
          </button>
        </div>
      )}

      {/* Stepper Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-[#1E5AE6] font-extrabold text-xs flex items-center justify-center shrink-0">
            1
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-[#0B1B3D] block">Initiate Scope</span>
            <span className="text-[10px] text-slate-400">Employer specifies attributes</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 font-extrabold text-xs flex items-center justify-center shrink-0">
            2
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-[#0B1B3D] block">Student Authorizes</span>
            <span className="text-[10px] text-slate-400">OTP challenge simulation</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center shrink-0">
            3
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-[#0B1B3D] block">Resolve Token</span>
            <span className="text-[10px] text-slate-400">Single-use purpose limited</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Step 1: Employer Initiates Verification */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1E5AE6] font-black text-xs flex items-center justify-center">
              1
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-[#0B1B3D]">
              Employer Initiation
            </h2>
          </div>

          <form onSubmit={handleInitiateRequest} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Target Credential:</label>
              <select
                aria-label="Select Target Credential"
                value={targetCredId}
                onChange={(e) => setTargetCredId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5AE6]/20 focus:border-[#1E5AE6]"
              >
                {credentials.map((cred) => (
                  <option key={cred.id} value={cred.id}>
                    {cred.credentialNumber} ({cred.payload.studentName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Requesting Verifier:</label>
              <input
                type="text"
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5AE6]/20 focus:border-[#1E5AE6]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Purpose of Verification:</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs h-18 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5AE6]/20 focus:border-[#1E5AE6]"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
              <span className="font-extrabold text-[#0B1B3D] block text-xs">
                Requested Attributes Scope:
              </span>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Course & Academic Year
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Institution & Completion Status
              </div>
              <div className="text-red-600 font-bold text-[10px] pt-1 border-t border-slate-200/60">
                • Redacted: Full APAAR, Aadhaar, DOB, and Home Address
              </div>
            </div>

            <button
              type="submit"
              disabled={isInitiating}
              className="w-full py-2.5 rounded-xl bg-[#1E5AE6] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {isInitiating ? "Dispatching..." : "Send Consent Request to Student"}
            </button>
          </form>
        </div>

        {/* Step 2: Student Reviews & Submits Simulated OTP */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 font-black text-xs flex items-center justify-center">
              2
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-[#0B1B3D]">
              Student Consent Portal
            </h2>
          </div>

          {selectedRequest ? (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 space-y-1">
                <span className="text-[10px] uppercase font-black text-teal-800 tracking-wider">
                  Active Challenge: #{selectedRequest.id}
                </span>
                <div className="font-extrabold text-[#0B1B3D]">{selectedRequest.requestingEmployer}</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{selectedRequest.purpose}</p>
                <div className="text-[10px] text-slate-500 font-mono pt-1">
                  Status: <strong className="text-teal-700">{selectedRequest.status}</strong> • Expires in 7 Days
                </div>
              </div>

              {/* Simulated Mobile OTP Challenge Box */}
              {selectedRequest.otpChallenge && selectedRequest.status === "PENDING" && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900 text-[11px] flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                      SIMULATED DIGILOCKER / SMS OTP
                    </span>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      Demo Auto-Issued
                    </span>
                  </div>

                  <div className="text-center py-2">
                    <span className="font-mono text-3xl font-black tracking-widest text-[#0B1B3D] bg-white px-5 py-1.5 rounded-xl border border-amber-300 shadow-sm inline-block">
                      {selectedRequest.otpChallenge.code}
                    </span>
                  </div>

                  <p className="text-[10px] text-amber-900 text-center leading-snug">
                    Enter this 6-digit simulated OTP below to authorize employer verification.
                  </p>
                </div>
              )}

              {selectedRequest.status === "PENDING" ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Enter 6-Digit OTP:</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      placeholder="e.g. 849201"
                      className="w-full text-center font-mono text-lg font-black p-2.5 rounded-xl border border-slate-300 tracking-widest focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => handleRespond(false)}
                      disabled={isResponding}
                      className="py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 transition-colors shadow-xs"
                    >
                      Deny Request
                    </button>
                    <button
                      onClick={() => handleRespond(true)}
                      disabled={isResponding || enteredOtp.length !== 6}
                      className="py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white font-bold transition-colors shadow-xs disabled:opacity-50"
                    >
                      {isResponding ? "Verifying..." : "Approve & Issue"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Consent Decision: <strong className="text-slate-900">{selectedRequest.status}</strong>
                  </span>
                  {selectedRequest.verificationToken && (
                    <div className="text-[11px] font-mono text-[#1E5AE6] bg-blue-50 p-2.5 rounded-xl border border-blue-200 flex items-center justify-between">
                      <span className="truncate">{selectedRequest.verificationToken}</span>
                      <button
                        onClick={() => handleCopyToken(selectedRequest.verificationToken!)}
                        className="p-1 hover:bg-blue-100 rounded text-blue-700"
                        title="Copy Token"
                      >
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No active consent request selected.
            </div>
          )}
        </div>

        {/* Step 3: Employer Resolves Token (Purpose-Limited View) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
              3
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-[#0B1B3D]">
              Employer Token Resolver
            </h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Enter Single-Use Verification Token:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={queryToken}
                  onChange={(e) => setQueryToken(e.target.value)}
                  placeholder="VTOKEN-XXXX-YYYY"
                  className="flex-1 font-mono text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
                <button
                  onClick={handleQueryToken}
                  disabled={isQueryingToken || !queryToken.trim()}
                  className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  Query
                </button>
              </div>
            </div>

            {/* Resolved Purpose-Limited Payload Card */}
            {tokenResult && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                {tokenResult.error ? (
                  <div className="text-red-700 font-bold flex items-center gap-2 text-xs">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>{String(tokenResult.error)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-emerald-800 font-black text-xs pb-2 border-b border-slate-200/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Academic Identity Verified</span>
                    </div>

                    <div className="space-y-2 text-slate-700 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Institution:</span>
                        <strong className="text-slate-900">{String(tokenResult.institution || "N/A")}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Course / Programme:</span>
                        <strong className="text-[#1E5AE6]">{String(tokenResult.course || "N/A")}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Year:</span>
                        <strong className="text-slate-900">{String(tokenResult.academicYear || "N/A")}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Completion Status:</span>
                        <strong className="text-emerald-700">{String(tokenResult.completionStatus || "N/A")}</strong>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/80 text-[10px] text-slate-400 leading-snug">
                      Authorized by student via OTP challenge. Single-use token invalidated upon query.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
