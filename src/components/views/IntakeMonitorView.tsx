"use client";

import React, { useState } from "react";
import { Course, Institution, Role } from "@/lib/types";
import { calculateCourseIntake } from "@/lib/intake";
import {
  Gauge,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Filter,
  X,
  Building2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface IntakeMonitorViewProps {
  currentRole: Role;
  courses: Course[];
  institutions: Institution[];
  selectedInstitutionId?: string;
}

export const IntakeMonitorView: React.FC<IntakeMonitorViewProps> = ({
  currentRole,
  courses,
  institutions,
  selectedInstitutionId,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedCourseForInvestigation, setSelectedCourseForInvestigation] = useState<Course | null>(null);

  // Filter courses based on role & filter
  const displayedCourses = courses.filter((c) => {
    if (currentRole === "INSTITUTION_ADMIN" && selectedInstitutionId && c.institutionId !== selectedInstitutionId) {
      return false;
    }
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: Course["status"]) => {
    switch (status) {
      case "OVER_INTAKE":
        return {
          bar: "bg-[#DC2626]",
          badge: "bg-red-50 text-red-700 ring-1 ring-red-200",
          label: "Over Intake Breach",
          icon: AlertOctagon,
        };
      case "CAPACITY_REACHED":
        return {
          bar: "bg-[#1E5AE6]",
          badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
          label: "Capacity Reached (100%)",
          icon: CheckCircle2,
        };
      case "WARNING":
        return {
          bar: "bg-[#D97706]",
          badge: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
          label: "Warning (≥90%)",
          icon: AlertTriangle,
        };
      case "NORMAL":
      default:
        return {
          bar: "bg-[#059669]",
          badge: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
          label: "Optimal (&lt;90%)",
          icon: CheckCircle2,
        };
    }
  };

  const breachCount = courses.filter((c) => c.status === "OVER_INTAKE").length;
  const warningCount = courses.filter((c) => c.status === "WARNING").length;
  const optimalCount = courses.filter((c) => c.status === "NORMAL").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AICTE Live Intake Guard
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E5AE6] ring-1 ring-blue-200">
              Clause 7.2 Enforcement
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time regulatory tracking of sanctioned capacity vs actual admissions, supernumerary quotas, and capacity breaches.
          </p>
        </div>

        {/* Status Counters Toolbar */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({courses.length})
          </button>
          <button
            onClick={() => setFilterStatus("OVER_INTAKE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "OVER_INTAKE"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
            }`}
          >
            Breaches ({breachCount})
          </button>
          <button
            onClick={() => setFilterStatus("WARNING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "WARNING"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            Near Cap ({warningCount})
          </button>
          <button
            onClick={() => setFilterStatus("NORMAL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "NORMAL"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            Optimal ({optimalCount})
          </button>
        </div>
      </div>

      {/* Course Utilization Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedCourses.map((c) => {
          const inst = institutions.find((i) => i.id === c.institutionId);
          const meta = getStatusColor(c.status);
          const StatusIcon = meta.icon;
          const isOver = c.status === "OVER_INTAKE";

          return (
            <div
              key={c.id}
              className={`bg-white rounded-2xl p-5 sm:p-6 border shadow-card transition-all duration-200 ${
                isOver
                  ? "border-red-300 ring-2 ring-red-100 bg-red-50/10"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900 truncate">{c.name}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${meta.badge}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{meta.label}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {inst?.name} • {inst?.state} • AY {c.academicYear}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black text-slate-900 tabular-nums">
                    {c.activeEnrolment} / {c.approvedCapacity}
                  </div>
                  <span
                    className={`text-xs font-extrabold tabular-nums ${
                      isOver ? "text-red-600" : "text-slate-500"
                    }`}
                  >
                    {c.utilizationPct}% utilized
                  </span>
                </div>
              </div>

              {/* Progress Bar with markers */}
              <div className="mt-3.5">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full ${meta.bar} transition-all duration-500`}
                    style={{ width: `${Math.min(100, c.utilizationPct)}%` }}
                  />
                </div>
              </div>

              {/* AICTE Supernumerary Quota Breakdown */}
              <div className="mt-4 pt-3.5 border-t border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  AICTE Supernumerary Quotas (Excluded from Sanctioned Denominator)
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-600 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="block font-bold text-slate-800">TFW (5%)</span>
                    <span className="font-mono text-slate-600 mt-0.5 block">
                      {c.supernumeraryEnrolled?.tfw || 0}/{c.supernumeraryLimits?.tfw || 5}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="block font-bold text-slate-800">EWS (10%)</span>
                    <span className="font-mono text-slate-600 mt-0.5 block">
                      {c.supernumeraryEnrolled?.ews || 0}/{c.supernumeraryLimits?.ews || 10}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="block font-bold text-slate-800">NRI/FN (15%)</span>
                    <span className="font-mono text-slate-600 mt-0.5 block">
                      {c.supernumeraryEnrolled?.nriOciFn || 0}/{c.supernumeraryLimits?.nriOciFn || 15}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="block font-bold text-slate-800">Lateral (10%)</span>
                    <span className="font-mono text-slate-600 mt-0.5 block">
                      {c.supernumeraryEnrolled?.lateralEntry || 0}/{c.supernumeraryLimits?.lateralEntry || 10}
                    </span>
                  </div>
                </div>
              </div>

              {/* Breach trigger or details action */}
              {isOver && (
                <div className="mt-4 pt-3 border-t border-red-100 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-red-600 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-red-500" />
                    <span>Breach: +{c.activeEnrolment - c.approvedCapacity} excess admissions</span>
                  </span>
                  <button
                    onClick={() => setSelectedCourseForInvestigation(c)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#DC2626] hover:bg-red-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Inspect Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Over-Intake Investigation Drawer */}
      {selectedCourseForInvestigation && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg h-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-red-200 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-start justify-between pb-4 border-b border-red-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-[#DC2626] px-2.5 py-0.5 rounded-full shadow-sm">
                  Regulatory Breach Dossier
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  {selectedCourseForInvestigation.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {institutions.find((i) => i.id === selectedCourseForInvestigation.institutionId)?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedCourseForInvestigation(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
                <span>AICTE Approval Process Handbook (APH) Non-Compliance</span>
              </div>
              <p className="text-red-800 leading-relaxed">
                Total active admissions ({selectedCourseForInvestigation.activeEnrolment}) exceed AICTE approved intake capacity ({selectedCourseForInvestigation.approvedCapacity}) by{" "}
                <strong className="underline decoration-red-400">
                  {selectedCourseForInvestigation.activeEnrolment - selectedCourseForInvestigation.approvedCapacity} seats
                </strong>.
              </p>
              <div className="pt-2 text-[11px] text-red-900 font-mono">
                Utilization: {selectedCourseForInvestigation.utilizationPct}% • Severity: CRITICAL
              </div>
            </div>

            <div className="mt-5 space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Prescribed Regulatory Enforcement Steps
              </h3>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all">
                  <span className="font-bold text-slate-900 block">1. Formal Show-Cause Notice Dispatch</span>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    Automated formal notice dispatched to institutional head requiring audit clarification within 15 calendar days under AICTE Sec 7.2.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all">
                  <span className="font-bold text-slate-900 block">2. Supernumerary Quota Re-classification</span>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    Verify whether unclassified TFW (5%) or EWS (10%) quota admissions were mistakenly accounted into the sanctioned capacity denominator.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedCourseForInvestigation(null)}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors cursor-pointer"
              >
                Close Breach Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
