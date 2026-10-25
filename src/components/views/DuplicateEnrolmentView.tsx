"use client";

import React, { useState } from "react";
import { DuplicateCase, Institution, Course, Role } from "@/lib/types";
import { maskApaarId } from "@/lib/apaar";
import {
  CopyCheck,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Layers,
} from "lucide-react";

interface DuplicateEnrolmentViewProps {
  currentRole: Role;
  duplicates: DuplicateCase[];
  institutions: Institution[];
  courses: Course[];
  onResolveCase?: (caseId: string, status: DuplicateCase["reviewStatus"], notes: string) => Promise<void>;
}

export const DuplicateEnrolmentView: React.FC<DuplicateEnrolmentViewProps> = ({
  currentRole,
  duplicates,
  institutions,
  courses,
  onResolveCase,
}) => {
  const [selectedCase, setSelectedCase] = useState<DuplicateCase | null>(
    duplicates.length > 0 ? duplicates[0] : null
  );
  const [resolutionStatus, setResolutionStatus] = useState<DuplicateCase["reviewStatus"]>("RESOLVED_DUPLICATE");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleExecuteResolution = async () => {
    if (!selectedCase || !onResolveCase) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onResolveCase(selectedCase.id, resolutionStatus, resolutionNotes || "Reviewed under AICTE Norms");
      setFeedback(`Case #${selectedCase.id} successfully updated to ${resolutionStatus}. SHA-256 audit block chained.`);
    } catch {
      setFeedback("Failed to update case resolution.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: DuplicateCase["reviewStatus"]) => {
    switch (status) {
      case "OPEN":
        return { label: "Open Conflict", bg: "bg-red-50 text-red-700 ring-1 ring-red-200" };
      case "UNDER_REVIEW":
        return { label: "Under Review", bg: "bg-amber-50 text-amber-800 ring-1 ring-amber-200" };
      case "CLARIFICATION_REQUESTED":
        return { label: "Clarification Req", bg: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" };
      case "RESOLVED_DUPLICATE":
        return { label: "Confirmed Duplicate", bg: "bg-purple-50 text-purple-700 ring-1 ring-purple-200" };
      case "RESOLVED_LEGITIMATE":
        return { label: "Resolved Legitimate", bg: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" };
    }
  };

  const openCasesCount = duplicates.filter((d) => d.reviewStatus === "OPEN").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Cross-Institution Duplicate Enrolment Detector
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">
              {openCasesCount} Active Conflicts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Detects identical APAAR identities concurrently active in multiple full-time degree programmes under AICTE Sec 4.3 and UGC guidelines.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Grid: Cases Directory on Left, Case Evidence Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Detected Conflicts ({duplicates.length})
            </h2>
            <span className="text-[10px] font-mono text-slate-400">AICTE Sec 4.3</span>
          </div>

          <div className="space-y-3">
            {duplicates.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              const badge = getStatusBadge(c.reviewStatus);
              const instA = institutions.find((i) => i.id === c.institutionAId);
              const instB = institutions.find((i) => i.id === c.institutionBId);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 relative ${
                    isSelected
                      ? "bg-blue-50/70 border-[#1E5AE6] ring-2 ring-[#1E5AE6]/30 shadow-sm"
                      : "bg-slate-50/50 hover:bg-white hover:border-slate-300 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {c.id}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-2 font-bold text-xs text-slate-900">
                    {c.studentName}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    APAAR: {maskApaarId(c.apaarId)}
                  </div>

                  <div className="mt-2.5 text-[11px] text-slate-600 flex items-center justify-between pt-2.5 border-t border-slate-200/80">
                    <span className="truncate max-w-[100px] font-medium">{instA?.name.slice(0, 16)}...</span>
                    <span className="font-bold text-red-500 text-[10px] uppercase">vs</span>
                    <span className="truncate max-w-[100px] font-medium">{instB?.name.slice(0, 16)}...</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Case Evidence & Resolution Workspace */}
        {selectedCase ? (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-7 flex flex-col space-y-6">
            {/* Case Title */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1E5AE6] bg-blue-50 px-2.5 py-0.5 rounded-full">
                  Dossier #{selectedCase.id}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  {selectedCase.studentName} — APAAR: {maskApaarId(selectedCase.apaarId)}
                </h2>
                <p className="text-xs text-red-600 font-bold mt-0.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Regulatory Conflict: {selectedCase.ruleTriggered}</span>
                </p>
              </div>

              <div className="text-right shrink-0 bg-red-50 p-2.5 rounded-xl border border-red-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Conflict Score</span>
                <span className="text-xl font-black text-red-600 tabular-nums">
                  {selectedCase.confidenceScore}%
                </span>
              </div>
            </div>

            {/* Side-by-Side Enrolment Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Institution A */}
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 pb-2 border-b border-blue-200/60">
                  <Building2 className="w-4 h-4 text-[#1E5AE6]" />
                  <span>Enrolment Record A</span>
                </div>
                <div className="text-xs space-y-1.5 text-slate-700">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Institution:</span>
                    <strong className="text-slate-900">{institutions.find((i) => i.id === selectedCase.institutionAId)?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Programme:</span>
                    <strong className="text-slate-900">{courses.find((c) => c.id === selectedCase.courseAId)?.name}</strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Academic Year:</span>
                    <strong className="text-slate-900 font-mono">{selectedCase.academicYearA}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mode:</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#1E5AE6] font-extrabold text-[10px]">
                      {selectedCase.programmeModeA}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <strong className="text-emerald-700">{selectedCase.statusA}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Admission Date:</span>
                    <span className="font-mono text-slate-700">{selectedCase.admissionDateA}</span>
                  </div>
                </div>
              </div>

              {/* Institution B */}
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/40 border border-purple-200/80 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 pb-2 border-b border-purple-200/60">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>Enrolment Record B</span>
                </div>
                <div className="text-xs space-y-1.5 text-slate-700">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Institution:</span>
                    <strong className="text-slate-900">{institutions.find((i) => i.id === selectedCase.institutionBId)?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Programme:</span>
                    <strong className="text-slate-900">{courses.find((c) => c.id === selectedCase.courseBId)?.name}</strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Academic Year:</span>
                    <strong className="text-slate-900 font-mono">{selectedCase.academicYearB}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mode:</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[10px]">
                      {selectedCase.programmeModeB}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <strong className="text-emerald-700">{selectedCase.statusB}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Admission Date:</span>
                    <span className="font-mono text-slate-700">{selectedCase.admissionDateB}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Investigation History Log */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Regulatory Audit Log & History
              </h3>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {selectedCase.investigationHistory.map((hist, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-800">{hist.actor} ({hist.action})</span>
                      <span className="font-mono">{hist.timestamp.slice(0, 10)}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{hist.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Controls */}
            <div className="pt-4 border-t border-slate-100 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Official Case Decision & Action
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Update Status:</label>
                  <select
                    aria-label="Select Case Decision"
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value as DuplicateCase["reviewStatus"])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-[#1E5AE6]"
                  >
                    <option value="RESOLVED_DUPLICATE">Resolve as Confirmed Duplicate</option>
                    <option value="RESOLVED_LEGITIMATE">Resolve as Legitimate (UGC Dual/Part-Time)</option>
                    <option value="UNDER_REVIEW">Mark Under Formal Review</option>
                    <option value="CLARIFICATION_REQUESTED">Request Institutional Clarification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reviewer Justification / Reason:</label>
                  <input
                    type="text"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter official resolution justification..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1E5AE6]"
                  />
                </div>
              </div>

              <button
                onClick={handleExecuteResolution}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#1E5AE6] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Recording Decision...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Record Official AICTE Regulatory Decision & Chained Hash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            Select a detected conflict case on the left to inspect comparative enrolment evidence.
          </div>
        )}
      </div>
    </div>
  );
};
