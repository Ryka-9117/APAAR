"use client";

import React, { useState, useMemo } from "react";
import { Institution, Course, Student, DuplicateCase, AuditEvent, Role } from "@/lib/types";
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  Users,
  AlertTriangle,
  Layers,
  Search,
  FileText,
  Calendar,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

interface AnalyticsReportsViewProps {
  currentRole: Role;
  institutions: Institution[];
  courses: Course[];
  students: Student[];
  duplicates: DuplicateCase[];
  auditEvents: AuditEvent[];
}

export const AnalyticsReportsView: React.FC<AnalyticsReportsViewProps> = ({
  currentRole,
  institutions,
  courses,
  students,
  duplicates,
  auditEvents,
}) => {
  const [selectedReport, setSelectedReport] = useState<string>("INTAKE_UTILIZATION");
  const [searchQuery, setSearchQuery] = useState("");

  const handleExportCsv = () => {
    let csvContent = "";
    let fileName = "AICTE_Report.csv";

    if (selectedReport === "INTAKE_UTILIZATION") {
      fileName = "AICTE_Intake_Utilization_Report.csv";
      const rows = [
        "Course Code,Course Name,Institution,Approved Capacity,Active Enrolment,Utilization %,Status",
        ...courses.map((c) => {
          const inst = institutions.find((i) => i.id === c.institutionId);
          return `"${c.code}","${c.name}","${inst?.name || c.institutionId}",${c.approvedCapacity},${c.activeEnrolment},${c.utilizationPct}%,"${c.status}"`;
        }),
      ];
      csvContent = rows.join("\n");
    } else if (selectedReport === "DUPLICATES") {
      fileName = "AICTE_Duplicate_Enrolments_Report.csv";
      const rows = [
        "Case ID,Student Name,APAAR ID,Institution A,Institution B,Confidence %,Review Status",
        ...duplicates.map((d) => {
          const instA = institutions.find((i) => i.id === d.institutionAId);
          const instB = institutions.find((i) => i.id === d.institutionBId);
          return `"${d.id}","${d.studentName}","${d.apaarId}","${instA?.name}","${instB?.name}",${d.confidenceScore}%,"${d.reviewStatus}"`;
        }),
      ];
      csvContent = rows.join("\n");
    } else {
      fileName = "AICTE_Audit_Trail_Report.csv";
      const rows = [
        "Block #,Timestamp,Actor,Role,Action Type,Target Entity,Current Hash",
        ...auditEvents.map(
          (e) =>
            `${e.eventNumber},"${e.timestamp}","${e.actorName}","${e.actorRole}","${e.actionType}","${e.targetEntity}","${e.currentHash}"`
        ),
      ];
      csvContent = rows.join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter((c) => {
      const inst = institutions.find((i) => i.id === c.institutionId);
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (inst && inst.name.toLowerCase().includes(q))
      );
    });
  }, [courses, institutions, searchQuery]);

  // Filter duplicates
  const filteredDuplicates = useMemo(() => {
    if (!searchQuery.trim()) return duplicates;
    const q = searchQuery.toLowerCase();
    return duplicates.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.studentName.toLowerCase().includes(q) ||
        d.apaarId.toLowerCase().includes(q)
    );
  }, [duplicates, searchQuery]);

  // Filter audit events
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return auditEvents;
    const q = searchQuery.toLowerCase();
    return auditEvents.filter(
      (e) =>
        e.actorName.toLowerCase().includes(q) ||
        e.actionType.toLowerCase().includes(q) ||
        e.targetEntity.toLowerCase().includes(q)
    );
  }, [auditEvents, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold text-[#0B1B3D] tracking-tight">
              Regulatory Reports & Intelligence Exports
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1E5AE6] border border-blue-200/80 shadow-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1E5AE6]" />
              AICTE Compliance Dossier
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate certified executive compliance reports, CSV spreadsheet exports, and printable committee dossiers.
          </p>
        </div>

        {/* Export Toolbar */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#1E5AE6] hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Selected CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Dossier
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setSelectedReport("INTAKE_UTILIZATION");
            setSearchQuery("");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            selectedReport === "INTAKE_UTILIZATION"
              ? "bg-[#0B1B3D] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Intake & Capacity Allotment Matrix
        </button>
        <button
          onClick={() => {
            setSelectedReport("DUPLICATES");
            setSearchQuery("");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            selectedReport === "DUPLICATES"
              ? "bg-[#0B1B3D] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Duplicate Enrolment Investigation
        </button>
        <button
          onClick={() => {
            setSelectedReport("AUDIT");
            setSearchQuery("");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            selectedReport === "AUDIT"
              ? "bg-[#0B1B3D] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Cryptographic Audit Ledger
        </button>
      </div>

      {/* Report Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-sm font-black text-[#0B1B3D]">
              {selectedReport === "INTAKE_UTILIZATION"
                ? "National Intake Utilization & Regulatory Compliance Matrix"
                : selectedReport === "DUPLICATES"
                ? "Cross-Institution Duplicate Enrolment Case Ledger"
                : "Cryptographic SHA-256 Audit Trail Event Log"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Certified for AICTE Regulatory Committee • Academic Year 2024-25
            </p>
          </div>

          {/* Search Filter in table */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter report rows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5AE6]/20 focus:border-[#1E5AE6]"
            />
          </div>
        </div>

        {/* Table 1: Intake & Utilization */}
        {selectedReport === "INTAKE_UTILIZATION" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                <tr>
                  <th className="py-3 px-3.5">Course Name</th>
                  <th className="py-3 px-3.5">Institution</th>
                  <th className="py-3 px-3.5">Approved Seats</th>
                  <th className="py-3 px-3.5">Active Enrolled</th>
                  <th className="py-3 px-3.5">Utilization %</th>
                  <th className="py-3 px-3.5">Regulatory Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((c) => {
                  const inst = institutions.find((i) => i.id === c.institutionId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5 font-extrabold text-slate-800">
                        {c.name}
                        <span className="block font-mono text-[10px] text-slate-400">{c.code}</span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 font-medium">{inst?.name}</td>
                      <td className="py-3 px-3.5 font-mono text-slate-700">{c.approvedCapacity}</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900">{c.activeEnrolment}</td>
                      <td className="py-3 px-3.5">
                        <span className="font-extrabold text-slate-800">{c.utilizationPct}%</span>
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.utilizationPct > 100
                                ? "bg-red-600"
                                : c.utilizationPct >= 90
                                ? "bg-amber-500"
                                : "bg-emerald-600"
                            }`}
                            style={{ width: `${Math.min(c.utilizationPct, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            c.status === "OVER_INTAKE"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : c.status === "WARNING"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table 2: Duplicate Enrolments */}
        {selectedReport === "DUPLICATES" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                <tr>
                  <th className="py-3 px-3.5">Case ID</th>
                  <th className="py-3 px-3.5">Student Name</th>
                  <th className="py-3 px-3.5">Institution A</th>
                  <th className="py-3 px-3.5">Institution B</th>
                  <th className="py-3 px-3.5">Confidence</th>
                  <th className="py-3 px-3.5">Review Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDuplicates.map((d) => {
                  const instA = institutions.find((i) => i.id === d.institutionAId);
                  const instB = institutions.find((i) => i.id === d.institutionBId);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-700">{d.id}</td>
                      <td className="py-3 px-3.5 font-extrabold text-slate-800">
                        {d.studentName}
                        <span className="block font-mono text-[10px] text-slate-400">APAAR: {d.apaarId}</span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">{instA?.name}</td>
                      <td className="py-3 px-3.5 text-slate-600">{instB?.name}</td>
                      <td className="py-3 px-3.5 font-bold text-red-600 font-mono">{d.confidenceScore}%</td>
                      <td className="py-3 px-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {d.reviewStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table 3: Audit Trail Log */}
        {selectedReport === "AUDIT" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                <tr>
                  <th className="py-3 px-3.5">Block #</th>
                  <th className="py-3 px-3.5">Timestamp</th>
                  <th className="py-3 px-3.5">Actor</th>
                  <th className="py-3 px-3.5">Action Type</th>
                  <th className="py-3 px-3.5">Target Entity</th>
                  <th className="py-3 px-3.5">SHA-256 Digest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-black text-slate-700">#{e.eventNumber}</td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500">{e.timestamp.slice(0, 10)}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-800">{e.actorName}</td>
                    <td className="py-3 px-3.5 font-extrabold text-[#0B1B3D]">{e.actionType}</td>
                    <td className="py-3 px-3.5 text-slate-600 text-[11px]">{e.targetEntity}</td>
                    <td className="py-3 px-3.5 font-mono text-[10px] text-slate-500">{e.currentHash.slice(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
