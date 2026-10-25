"use client";

import React, { useMemo } from "react";
import { Institution, Course, Student, DuplicateCase, ForensicDocument, AuditEvent, Role } from "@/lib/types";
import { StatCard } from "../StatCard";
import { StateHeatmap } from "../StateHeatmap";
import {
  Building2,
  Users,
  GraduationCap,
  Percent,
  AlertTriangle,
  AlertOctagon,
  CopyCheck,
  FileSearch,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";

interface OverviewViewProps {
  currentRole: Role;
  institutions: Institution[];
  courses: Course[];
  students: Student[];
  duplicates: DuplicateCase[];
  forensics: ForensicDocument[];
  auditEvents: AuditEvent[];
  selectedInstitutionId?: string;
  selectedState?: string;
  onSelectState: (state?: string) => void;
  onNavigateTab: (tab: string) => void;
  onSelectCourseForInspection?: (courseId: string) => void;
  onSelectDuplicateForInspection?: (caseId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  currentRole,
  institutions,
  courses,
  students,
  duplicates,
  forensics,
  auditEvents,
  selectedInstitutionId,
  selectedState,
  onSelectState,
  onNavigateTab,
  onSelectCourseForInspection,
  onSelectDuplicateForInspection,
}) => {
  // Filter by selected state if applicable
  const filteredInstitutions = useMemo(() => {
    if (currentRole === "INSTITUTION_ADMIN" && selectedInstitutionId) {
      return institutions.filter((i) => i.id === selectedInstitutionId);
    }
    if (selectedState) {
      return institutions.filter((i) => i.state === selectedState);
    }
    return institutions;
  }, [institutions, selectedState, currentRole, selectedInstitutionId]);

  const filteredInstIds = useMemo(
    () => new Set(filteredInstitutions.map((i) => i.id)),
    [filteredInstitutions]
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => filteredInstIds.has(c.institutionId));
  }, [courses, filteredInstIds]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => filteredInstIds.has(s.institutionId));
  }, [students, filteredInstIds]);

  const filteredDuplicates = useMemo(() => {
    return duplicates.filter(
      (d) => filteredInstIds.has(d.institutionAId) || filteredInstIds.has(d.institutionBId)
    );
  }, [duplicates, filteredInstIds]);

  const filteredForensics = useMemo(() => {
    return forensics.filter((f) => filteredInstIds.has(f.institutionId));
  }, [forensics, filteredInstIds]);

  // Aggregate Metrics
  const totalInstitutions = filteredInstitutions.length;
  const totalApprovedIntake = filteredCourses.reduce((sum, c) => sum + c.approvedCapacity, 0);
  const totalEnrolled = filteredCourses.reduce((sum, c) => sum + c.activeEnrolment, 0);
  const overallUtilization =
    totalApprovedIntake > 0
      ? Number(((totalEnrolled / totalApprovedIntake) * 100).toFixed(1))
      : 0;

  const coursesWarning = filteredCourses.filter((c) => c.status === "WARNING").length;
  const coursesOverIntake = filteredCourses.filter((c) => c.status === "OVER_INTAKE");
  const openDuplicates = filteredDuplicates.filter((d) => d.reviewStatus === "OPEN");
  const flaggedForensics = filteredForensics.filter(
    (f) => f.reviewStatus === "FLAGGED" || f.reviewStatus === "CONFIRMED_ANOMALY"
  );

  // Institution risk ranking sorted by riskScore descending
  const rankedInstitutions = useMemo(() => {
    return [...filteredInstitutions].sort((a, b) => b.riskScore - a.riskScore);
  }, [filteredInstitutions]);

  const currentInstitution = institutions.find((i) => i.id === selectedInstitutionId);

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* 1. Page Header & Executive Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {currentRole === "INSTITUTION_ADMIN"
                ? "Institutional Governance Dashboard"
                : "National Student Intelligence & Governance Command Center"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-white shadow-sm">
              AICTE APH 2024–25
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentRole === "INSTITUTION_ADMIN"
              ? `Operational monitoring & compliance cockpit for ${currentInstitution?.name || "your institution"}`
              : "Real-time cross-institutional student records, approved intake limits, dual enrolment detection, and tamper verification."}
          </p>
        </div>

        {/* State Filter Indicator */}
        {selectedState && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs text-[#1E5AE6] font-medium self-start md:self-auto shadow-sm">
            <span>
              Filtered by State: <strong>{selectedState}</strong>
            </span>
            <button
              onClick={() => onSelectState(undefined)}
              className="text-xs underline hover:text-blue-900 font-bold ml-1 cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* 2. Critical Regulatory Action Banner (if active breaches exist) */}
      {coursesOverIntake.length > 0 && (
        <div className="bg-red-50/90 border border-red-200 border-l-4 border-l-[#DC2626] p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-100 text-[#DC2626] shrink-0 mt-0.5">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-red-900 uppercase tracking-wider">
                  AICTE Regulatory Action Required: Approved Intake Exceeded
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-200/80 text-red-900">
                  Clause 7.2 Breach
                </span>
              </div>
              <p className="text-xs text-red-800/90 mt-1 leading-relaxed">
                <strong>{coursesOverIntake[0].name}</strong> at{" "}
                <strong>
                  {institutions.find((i) => i.id === coursesOverIntake[0].institutionId)?.name}
                </strong>{" "}
                has enrolled{" "}
                <span className="font-bold underline decoration-red-400">
                  {coursesOverIntake[0].activeEnrolment} students
                </span>{" "}
                against a sanctioned intake capacity of{" "}
                <strong>{coursesOverIntake[0].approvedCapacity} seats</strong> (
                {coursesOverIntake[0].utilizationPct}% utilization).
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("intake")}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#DC2626] hover:bg-red-700 text-white shadow-sm transition-all shrink-0 flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>Inspect Breach Dossier</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Primary Executive KPIs (Sanctioned Intake, Admissions, Utilization, Campuses) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            National Academic Capacity & Enrolment
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Updated Real-time
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Sanctioned Intake"
            value={totalApprovedIntake.toLocaleString()}
            subtitle="AICTE Sanctioned Regular Seats"
            icon={GraduationCap}
            variant="neutral"
            badge="APH 2024"
          />
          <StatCard
            title="Active Admissions"
            value={totalEnrolled.toLocaleString()}
            subtitle="Verified Registered Students"
            icon={Users}
            variant="primary"
            onClick={() => onNavigateTab("registry")}
            trend={{ value: "4.8%", isPositive: true, label: "YoY" }}
          />
          <StatCard
            title="Capacity Utilization"
            value={`${overallUtilization}%`}
            subtitle="National Average Seat Fill Rate"
            icon={Percent}
            variant={overallUtilization > 95 ? "warning" : "success"}
            onClick={() => onNavigateTab("intake")}
            trend={{
              value: overallUtilization > 95 ? "High Load" : "Balanced",
              isPositive: overallUtilization <= 95,
            }}
          />
          <StatCard
            title="Approved Institutions"
            value={totalInstitutions}
            subtitle="Accredited Technical Campuses"
            icon={Building2}
            variant="teal"
            onClick={() => onNavigateTab("institutions")}
          />
        </div>
      </div>

      {/* 4. Regulatory Risk & Compliance Watchlist (4 distinct operational cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Regulatory Compliance & Intelligence Watchlist
          </span>
          <span className="text-[11px] text-slate-400">
            Active Alerts Requiring Verification
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Over-Intake Breaches"
            value={coursesOverIntake.length}
            subtitle="Approved Capacity Exceeded"
            icon={AlertOctagon}
            variant={coursesOverIntake.length > 0 ? "danger" : "neutral"}
            onClick={() => onNavigateTab("intake")}
            badge={coursesOverIntake.length > 0 ? "Critical" : "Clear"}
          />
          <StatCard
            title="Near Capacity"
            value={coursesWarning}
            subtitle="&ge; 90% Sanctioned Headroom"
            icon={TrendingUp}
            variant={coursesWarning > 0 ? "warning" : "neutral"}
            onClick={() => onNavigateTab("intake")}
          />
          <StatCard
            title="Duplicate Enrolments"
            value={openDuplicates.length}
            subtitle="Concurrent Dual Degree Alerts"
            icon={CopyCheck}
            variant={openDuplicates.length > 0 ? "warning" : "neutral"}
            onClick={() => onNavigateTab("duplicates")}
            badge="AICTE Sec 4.3"
          />
          <StatCard
            title="PDF Forensic Flags"
            value={flaggedForensics.length}
            subtitle="Suspected Layout/Byte Anomalies"
            icon={FileSearch}
            variant={flaggedForensics.length > 0 ? "danger" : "neutral"}
            onClick={() => onNavigateTab("forensics")}
            badge="pHash / SHA256"
          />
        </div>
      </div>

      {/* 5. Geographic State Distribution Map & Intake Allotment */}
      {currentRole !== "INSTITUTION_ADMIN" && (
        <StateHeatmap
          institutions={institutions}
          courses={courses}
          selectedState={selectedState}
          onSelectState={onSelectState}
        />
      )}

      {/* 6. Dual Action Panels: Over-Intake Live Breaches & Institutional Risk Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Live Over-Intake & Warning List */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-50 text-red-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Live Over-Intake & Capacity Breaches
                </h2>
                <p className="text-xs text-slate-500">
                  AICTE APH Clause 7.2 real-time monitoring of actual admissions vs approved capacity
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("intake")}
              className="text-xs font-bold text-[#1E5AE6] hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3.5 divide-y divide-slate-100 overflow-y-auto max-h-[340px]">
            {filteredCourses
              .filter(
                (c) =>
                  c.status === "OVER_INTAKE" ||
                  c.status === "WARNING" ||
                  c.status === "CAPACITY_REACHED"
              )
              .map((c) => {
                const inst = institutions.find((i) => i.id === c.institutionId);
                const isOver = c.status === "OVER_INTAKE";

                return (
                  <div
                    key={c.id}
                    onClick={() => onNavigateTab("intake")}
                    className="py-3 px-2 rounded-xl hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {c.name}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isOver
                              ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                              : c.status === "CAPACITY_REACHED"
                              ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                              : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                          }`}
                        >
                          {c.status === "OVER_INTAKE" ? "BREACH" : c.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {inst?.name} • {inst?.state}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-extrabold text-slate-900 tabular-nums">
                        {c.activeEnrolment} / {c.approvedCapacity}
                      </div>
                      <span
                        className={`text-[11px] font-bold tabular-nums ${
                          isOver ? "text-red-600" : "text-amber-600"
                        }`}
                      >
                        {c.utilizationPct}% utilization
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Institution Risk Index & Compliance Ranking */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-[#0D9488]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Institution Risk Index & Compliance Ranking
                </h2>
                <p className="text-xs text-slate-500">
                  Multi-factor regulatory score computed from intake, duplicate alerts, and document forensics
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("analytics")}
              className="text-xs font-bold text-[#1E5AE6] hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3.5 divide-y divide-slate-100 overflow-y-auto max-h-[340px]">
            {rankedInstitutions.slice(0, 5).map((inst, index) => {
              const isHighRisk = inst.riskScore >= 60;
              const isMedRisk = inst.riskScore >= 35 && inst.riskScore < 60;

              return (
                <div
                  key={inst.id}
                  onClick={() => onNavigateTab("institutions")}
                  className="py-3 px-2 rounded-xl hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-black text-slate-400 w-5 text-center shrink-0">
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        {inst.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {inst.city}, {inst.state} • Code: {inst.code}
                      </span>
                      {inst.riskFactors && inst.riskFactors.length > 0 && (
                        <p className="text-[10px] text-amber-700 font-medium mt-0.5 truncate max-w-xs">
                          {inst.riskFactors[0].description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                        isHighRisk
                          ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                          : isMedRisk
                          ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                          : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                      }`}
                    >
                      Risk {inst.riskScore}/100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
