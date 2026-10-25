"use client";

import React, { useState } from "react";
import { CanonicalVerificationStatus, VerificationCategory, Role } from "@/lib/types";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Radio,
  RefreshCw,
  Search,
  Activity,
  Layers,
  Server,
  Zap,
} from "lucide-react";

interface VerificationRequestItem {
  id: string;
  category: VerificationCategory;
  requestingParty: string;
  targetId: string;
  status: CanonicalVerificationStatus;
  scope: string;
  sourceChecked: string;
  requestedAt: string;
  respondedAt: string;
  reason?: string;
  evidenceRef?: string;
}

export const VerificationGatewayView: React.FC<{ currentRole: Role }> = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTarget, setSearchTarget] = useState("");
  const [simulatedLookupId, setSimulatedLookupId] = useState("");
  const [activeLookupResult, setActiveLookupResult] = useState<VerificationRequestItem | null>(null);

  // 6 Verification Categories with descriptions
  const categories: { id: VerificationCategory; label: string; desc: string }[] = [
    { id: "APAAR_REGISTRY", label: "APAAR Identity Registry", desc: "National Academic Bank of Credits / DigiLocker APAAR Gateway" },
    { id: "INSTITUTIONAL_STUDENT", label: "Institutional Student Registry", desc: "Institution SIS and admission registry checks" },
    { id: "COURSE_INTAKE", label: "Course & Intake Registry", desc: "AICTE Approval Process Handbook (APH) sanctioned intake allottments" },
    { id: "ADMISSION_RECORD", label: "Admission & Enrolment Record", desc: "Active admission status, date of admission, and seat category verification" },
    { id: "DIGITAL_CREDENTIAL", label: "Digital Credential Authenticity", desc: "Cryptographic HMAC-SHA256 / Ed25519 digital signature validation" },
    { id: "ISSUING_SOURCE", label: "Issuing Institution / Authorized Source", desc: "AICTE Accreditation and establishment registry" },
  ];

  // Provider health monitor (Mock Adapters)
  const providerHealth = [
    { name: "Mock APAAR Gateway", latency: "42ms", uptime: "99.98%", status: "HEALTHY", mode: "SIMULATED_ABC" },
    { name: "AICTE APH Intake Engine", latency: "18ms", uptime: "100%", status: "HEALTHY", mode: "LOCAL_ACID" },
    { name: "SIS Student Adapter", latency: "65ms", uptime: "99.85%", status: "HEALTHY", mode: "SIMULATED_SIS" },
    { name: "HMAC-SHA256 Signer", latency: "8ms", uptime: "100%", status: "HEALTHY", mode: "NODE_CRYPTO" },
  ];

  // Pre-seeded verification requests covering all 6 canonical statuses
  const [requests, setRequests] = useState<VerificationRequestItem[]>([
    {
      id: "VR-REQ-8001",
      category: "APAAR_REGISTRY",
      requestingParty: "AICTE Central Admission Directorate",
      targetId: "9842-1234-5678",
      status: "VERIFIED",
      scope: "Full Academic Identity Check",
      sourceChecked: "MOCK_ACADEMIC_BANK_OF_CREDITS_SIMULATOR",
      requestedAt: "2024-09-18T10:15:00Z",
      respondedAt: "2024-09-18T10:15:01Z",
      evidenceRef: "ABC-REG-MATCH-9842",
    },
    {
      id: "VR-REQ-8002",
      category: "APAAR_REGISTRY",
      requestingParty: "DITS Admissions Office",
      targetId: "9012-3456-7812",
      status: "MISMATCH",
      scope: "DOB & Name Reconciliation",
      sourceChecked: "MOCK_ACADEMIC_BANK_OF_CREDITS_SIMULATOR",
      requestedAt: "2024-09-18T11:00:00Z",
      respondedAt: "2024-09-18T11:00:01Z",
      reason: "Date of birth discrepancy: institutional record 2003-03-28 vs national registry 2003-03-25.",
    },
    {
      id: "VR-REQ-8003",
      category: "APAAR_REGISTRY",
      requestingParty: "VEA Verification Wing",
      targetId: "4444-5555-6666",
      status: "NOT_FOUND",
      scope: "Identity Existence Lookup",
      sourceChecked: "MOCK_ACADEMIC_BANK_OF_CREDITS_SIMULATOR",
      requestedAt: "2024-09-18T11:30:00Z",
      respondedAt: "2024-09-18T11:30:02Z",
      reason: "Identifier syntactically valid but no matching identity exists on the simulated registry.",
    },
    {
      id: "VR-REQ-8004",
      category: "DIGITAL_CREDENTIAL",
      requestingParty: "Tata Consultancy Services (Employer)",
      targetId: "CRED-VS-2024-9842",
      status: "PENDING",
      scope: "Course, Academic Year, Completion Status",
      sourceChecked: "CONSENT_GATEWAY",
      requestedAt: "2024-09-19T09:00:00Z",
      respondedAt: "2024-09-19T09:00:00Z",
      reason: "Awaiting student OTP consent authorization via student portal.",
    },
    {
      id: "VR-REQ-8005",
      category: "DIGITAL_CREDENTIAL",
      requestingParty: "Infosys Verification Unit",
      targetId: "CRED-VS-2020-0099",
      status: "EXPIRED",
      scope: "Pre-employment Academic Verification",
      sourceChecked: "AICTE_ROOT_KEY_REGISTRY",
      requestedAt: "2024-09-17T14:00:00Z",
      respondedAt: "2024-09-17T14:00:01Z",
      reason: "The 4-year validity window of the academic provisional credential has expired.",
    },
    {
      id: "VR-REQ-8006",
      category: "ISSUING_SOURCE",
      requestingParty: "State Technical Board",
      targetId: "INST-RIPE",
      status: "UNAVAILABLE",
      scope: "Accreditation Validity Check",
      sourceChecked: "MOCK_NBA_REGISTRY_ADAPTER",
      requestedAt: "2024-09-19T12:00:00Z",
      respondedAt: "2024-09-19T12:00:05Z",
      reason: "Simulated upstream timeout on regulatory accreditation server (HTTP 504).",
    },
  ]);

  const getStatusBadge = (status: CanonicalVerificationStatus) => {
    switch (status) {
      case "VERIFIED":
        return { label: "Verified", bg: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200", icon: CheckCircle2 };
      case "MISMATCH":
        return { label: "Mismatch", bg: "bg-amber-50 text-amber-800 ring-1 ring-amber-200", icon: AlertTriangle };
      case "NOT_FOUND":
        return { label: "Not Found", bg: "bg-red-50 text-red-700 ring-1 ring-red-200", icon: XCircle };
      case "PENDING":
        return { label: "Pending OTP", bg: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", icon: Clock };
      case "EXPIRED":
        return { label: "Expired", bg: "bg-slate-100 text-slate-700 ring-1 ring-slate-300", icon: Clock };
      case "UNAVAILABLE":
        return { label: "Unavailable", bg: "bg-purple-50 text-purple-700 ring-1 ring-purple-200", icon: Radio };
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (selectedCategory !== "ALL" && r.category !== selectedCategory) return false;
    if (selectedStatus !== "ALL" && r.status !== selectedStatus) return false;
    if (searchTarget && !r.targetId.toLowerCase().includes(searchTarget.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AICTE Unified Verification Gateway
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E5AE6] ring-1 ring-blue-200">
              6 Canonical Regulatory States
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardized multi-source academic and credential verification engine with immutable proof references.
          </p>
        </div>
      </div>

      {/* Provider Health Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-[#0D9488]">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900">
              Provider Health & Regulatory Gateway Adapters
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            All 4 Gateway Adapters Operational
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {providerHealth.map((p, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">{p.name}</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="mt-2.5 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <strong className="text-slate-800 font-mono">{p.latency}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Availability:</span>
                  <strong className="text-slate-800 font-mono">{p.uptime}</strong>
                </div>
                <div className="pt-1 font-mono text-[9px] text-[#1E5AE6] font-bold">
                  {p.mode}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6 Canonical Status Showcase Cards */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Canonical Verification Status Filter
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(["VERIFIED", "MISMATCH", "NOT_FOUND", "PENDING", "EXPIRED", "UNAVAILABLE"] as CanonicalVerificationStatus[]).map(
            (status) => {
              const meta = getStatusBadge(status);
              const Icon = meta.icon;
              const count = requests.filter((r) => r.status === status).length;
              const isSelected = selectedStatus === status;

              return (
                <div
                  key={status}
                  onClick={() => setSelectedStatus(isSelected ? "ALL" : status)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "ring-2 ring-blue-600 bg-blue-50/60 border-blue-500 shadow-sm"
                      : "bg-white hover:bg-slate-50/80 border-slate-200 shadow-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${meta.bg}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-2 text-xl font-black text-slate-900 tabular-nums">{count}</div>
                  <span className="text-[10px] text-slate-400 font-medium">Logged Requests</span>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Filter and Query Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTarget}
            onChange={(e) => setSearchTarget(e.target.value)}
            placeholder="Search Target ID (APAAR ID, Credential ID, Institution)..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200/90 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E5AE6] focus:ring-2 focus:ring-[#1E5AE6]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            aria-label="Filter Verification Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">All 6 Verification Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          {(selectedCategory !== "ALL" || selectedStatus !== "ALL" || searchTarget) && (
            <button
              onClick={() => {
                setSelectedCategory("ALL");
                setSelectedStatus("ALL");
                setSearchTarget("");
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Verification Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Request ID</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Requesting Party</th>
                <th className="py-3.5 px-4">Target Reference</th>
                <th className="py-3.5 px-4">Canonical Status</th>
                <th className="py-3.5 px-4">Source Checked</th>
                <th className="py-3.5 px-4">Outcome Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((req) => {
                const meta = getStatusBadge(req.status);
                const StatusIcon = meta.icon;

                return (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{req.id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{req.category}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{req.requestingParty}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1E5AE6]">{req.targetId}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${meta.bg}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{meta.label}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] font-mono text-slate-500">{req.sourceChecked}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {req.reason || req.evidenceRef || "Request verified successfully"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
