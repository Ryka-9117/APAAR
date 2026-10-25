"use client";

import React, { useState, useMemo } from "react";
import { Student, Institution, Course, Role, ApaarVerificationOutcome } from "@/lib/types";
import { maskApaarId, formatApaarId } from "@/lib/apaar";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Award,
  ChevronRight,
  ShieldCheck,
  Building2,
  GraduationCap,
  Calendar,
  X,
  FileCheck,
  Copy,
  Check,
  SlidersHorizontal,
} from "lucide-react";

interface StudentRegistryViewProps {
  currentRole: Role;
  students: Student[];
  institutions: Institution[];
  courses: Course[];
  selectedInstitutionId?: string;
  onUpdateStudent?: (studentId: string, updates: Partial<Student>) => Promise<void>;
  onVerifyApaar?: (student: Student) => Promise<void>;
  onIssueCredential?: (student: Student) => void;
  onNavigateTab?: (tab: string) => void;
}

export const StudentRegistryView: React.FC<StudentRegistryViewProps> = ({
  currentRole,
  students,
  institutions,
  courses,
  selectedInstitutionId,
  onUpdateStudent,
  onVerifyApaar,
  onIssueCredential,
  onNavigateTab,
}) => {
  const [search, setSearch] = useState("");
  const [filterInstitution, setFilterInstitution] = useState<string>(
    currentRole === "INSTITUTION_ADMIN" ? selectedInstitutionId || "ALL" : "ALL"
  );
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterApaarOutcome, setFilterApaarOutcome] = useState<string>("ALL");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showUnmaskedApaar, setShowUnmaskedApaar] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filterInstitution !== "ALL" && s.institutionId !== filterInstitution) return false;
      if (filterStatus !== "ALL" && s.enrolmentStatus !== filterStatus) return false;
      if (filterApaarOutcome !== "ALL" && s.apaarStatus !== filterApaarOutcome) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = s.fullName.toLowerCase().includes(q);
        const matchesId = s.institutionalStudentId.toLowerCase().includes(q);
        const matchesApaar = s.apaarNormalized.includes(q);
        if (!matchesName && !matchesId && !matchesApaar) return false;
      }
      return true;
    });
  }, [students, filterInstitution, filterStatus, filterApaarOutcome, search]);

  const handleRunVerification = async (student: Student) => {
    if (!onVerifyApaar) return;
    setIsVerifying(true);
    setVerificationFeedback(null);
    try {
      await onVerifyApaar(student);
      setVerificationFeedback("Verification request completed against Mock APAAR Registry.");
    } catch {
      setVerificationFeedback("Verification request failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyApaar = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getOutcomeBadge = (outcome: ApaarVerificationOutcome) => {
    switch (outcome) {
      case "REGISTRY_MATCH":
        return {
          label: "Verified Match",
          bg: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
          icon: CheckCircle2,
        };
      case "IDENTITY_NOT_FOUND":
        return {
          label: "Not Found",
          bg: "bg-red-50 text-red-700 ring-1 ring-red-200/80",
          icon: XCircle,
        };
      case "NAME_MISMATCH":
        return {
          label: "Name Mismatch",
          bg: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
          icon: AlertTriangle,
        };
      case "DOB_MISMATCH":
        return {
          label: "DOB Mismatch",
          bg: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
          icon: AlertTriangle,
        };
      case "FORMAT_VALID":
        return {
          label: "Format Valid",
          bg: "bg-blue-50 text-blue-800 ring-1 ring-blue-200/80",
          icon: Clock,
        };
      case "VERIFICATION_UNAVAILABLE":
      default:
        return {
          label: "Unavailable",
          bg: "bg-slate-50 text-slate-700 ring-1 ring-slate-200/80",
          icon: Clock,
        };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Student Academic Registry
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E5AE6] ring-1 ring-blue-200">
              {filteredStudents.length} Records Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            National repository of verified student enrolments, APAAR credentials, and sanctioned seat allocations.
          </p>
        </div>

        {currentRole === "INSTITUTION_ADMIN" && (
          <button
            onClick={() => onNavigateTab && onNavigateTab("upload")}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1E5AE6] hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
          >
            <span>+ Ingest Batch Records</span>
          </button>
        )}
      </div>

      {/* Modern Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Student Name, Student ID, or APAAR..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200/90 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E5AE6] focus:ring-2 focus:ring-[#1E5AE6]/20 transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Institution Filter */}
          {currentRole !== "INSTITUTION_ADMIN" && (
            <select
              aria-label="Filter by Institution"
              value={filterInstitution}
              onChange={(e) => setFilterInstitution(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">All Institutions</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          )}

          {/* APAAR Status Filter */}
          <select
            aria-label="Filter by APAAR Outcome"
            value={filterApaarOutcome}
            onChange={(e) => setFilterApaarOutcome(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none cursor-pointer font-medium"
          >
            <option value="ALL">All APAAR Statuses</option>
            <option value="REGISTRY_MATCH">Verified Match</option>
            <option value="IDENTITY_NOT_FOUND">Identity Not Found</option>
            <option value="DOB_MISMATCH">DOB Mismatch</option>
            <option value="NAME_MISMATCH">Name Mismatch</option>
          </select>

          {/* Enrolment Status Filter */}
          <select
            aria-label="Filter by Enrolment Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none cursor-pointer font-medium"
          >
            <option value="ALL">All Enrolments</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>

          {(search || filterInstitution !== "ALL" || filterStatus !== "ALL" || filterApaarOutcome !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setFilterInstitution("ALL");
                setFilterStatus("ALL");
                setFilterApaarOutcome("ALL");
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Student Records Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Student & ID</th>
                <th className="py-3.5 px-4">APAAR Identifier</th>
                <th className="py-3.5 px-4">Institution</th>
                <th className="py-3.5 px-4">Course & Academic Year</th>
                <th className="py-3.5 px-4">Seat Category</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Enrolment</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.slice(0, 50).map((stu) => {
                const inst = institutions.find((i) => i.id === stu.institutionId);
                const course = courses.find((c) => c.id === stu.courseId);
                const badge = getOutcomeBadge(stu.apaarStatus);
                const BadgeIcon = badge.icon;

                return (
                  <tr
                    key={stu.id}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedStudent(stu)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1E5AE6] font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(stu.fullName)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                            {stu.fullName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {stu.institutionalStudentId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {maskApaarId(stu.apaarId, false)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 block truncate max-w-[190px]">
                        {inst?.name || stu.institutionId}
                      </span>
                      <span className="text-[10px] text-slate-500">{inst?.state}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 block truncate max-w-[170px]">
                        {course?.name || stu.courseId}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        AY {stu.academicYear}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {stu.seatCategory}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        <span>{badge.label}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          stu.enrolmentStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {stu.enrolmentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(stu);
                        }}
                        className="px-3 py-1.5 text-[11px] font-semibold text-[#1E5AE6] hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Inspection Drawer / Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-xl h-full max-h-[94vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                  {getInitials(selectedStudent.fullName)}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1E5AE6] bg-blue-50 px-2 py-0.5 rounded-full">
                    Student Dossier
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedStudent.fullName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Institutional ID: {selectedStudent.institutionalStudentId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback notification */}
            {verificationFeedback && (
              <div className="mt-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#1E5AE6] font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1E5AE6]" />
                <span>{verificationFeedback}</span>
              </div>
            )}

            {/* APAAR Identity Card */}
            <div className="mt-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1E5AE6]" />
                  APAAR Academic Identifier
                </span>
                <button
                  onClick={() => setShowUnmaskedApaar(!showUnmaskedApaar)}
                  className="text-xs text-[#1E5AE6] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  {showUnmaskedApaar ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showUnmaskedApaar ? "Mask Identifier" : "Reveal Full"}</span>
                </button>
              </div>

              <div className="font-mono text-base font-black text-slate-900 tracking-wider bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                <span>{maskApaarId(selectedStudent.apaarId, showUnmaskedApaar)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyApaar(selectedStudent.apaarId)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copy APAAR Identifier"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <span className="text-[10px] uppercase font-sans font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                    Luhn Verified
                  </span>
                </div>
              </div>

              {/* APAAR Validation Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <span className="text-xs text-slate-600">
                  Verification Status: <strong>{selectedStudent.apaarStatus}</strong>
                </span>
                <button
                  onClick={() => handleRunVerification(selectedStudent)}
                  disabled={isVerifying}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#1E5AE6] hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
                >
                  {isVerifying ? "Querying Gateway..." : "Validate APAAR Registry"}
                </button>
              </div>
            </div>

            {/* Enrolment Details Grid */}
            <div className="mt-5 space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Enrolment & Programme Profile
              </h3>
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[11px] block">Institution:</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {institutions.find((i) => i.id === selectedStudent.institutionId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Programme:</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {courses.find((c) => c.id === selectedStudent.courseId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Academic Year:</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedStudent.academicYear}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Admission Date:</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedStudent.admissionDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Programme Mode:</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedStudent.programmeMode}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Seat Category:</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedStudent.seatCategory}</span>
                </div>
              </div>
            </div>

            {/* Actions: Digital Credential Issuance */}
            <div className="mt-auto pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  if (onIssueCredential) onIssueCredential(selectedStudent);
                  setSelectedStudent(null);
                }}
                className="w-full py-3 px-4 text-xs font-bold rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Issue HMAC-SHA256 Signed Credential</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
