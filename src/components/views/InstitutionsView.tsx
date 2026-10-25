"use client";

import React, { useState, useMemo } from "react";
import { Institution, Course, Role } from "@/lib/types";
import {
  Building2,
  MapPin,
  Award,
  GraduationCap,
  ShieldAlert,
  Search,
  ExternalLink,
  Mail,
  Phone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";

interface InstitutionsViewProps {
  currentRole: Role;
  institutions: Institution[];
  courses: Course[];
  onSelectInstitution?: (id: string) => void;
}

export const InstitutionsView: React.FC<InstitutionsViewProps> = ({
  currentRole,
  institutions,
  courses,
  onSelectInstitution,
}) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return institutions.filter((inst) => {
      if (filterType !== "ALL" && inst.type !== filterType) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        inst.name.toLowerCase().includes(q) ||
        inst.code.toLowerCase().includes(q) ||
        inst.state.toLowerCase().includes(q) ||
        inst.city.toLowerCase().includes(q)
      );
    });
  }, [institutions, search, filterType]);

  const highRiskCount = institutions.filter((i) => i.riskScore >= 60).length;
  const totalApprovedIntake = institutions.reduce((sum, i) => sum + i.approvedIntakeTotal, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold text-[#0B1B3D] tracking-tight">
              AICTE Approved Institutions Directory
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1E5AE6] border border-blue-200/80 shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-[#1E5AE6]" />
              {institutions.length} Accredited Campuses
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            National regulatory oversight of approved technical campuses, sanctioned intake allotments, and automated institutional risk scoring.
          </p>
        </div>
      </div>

      {/* Directory Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Total Institutions
          </div>
          <div className="text-2xl font-black text-[#0B1B3D] mt-1">{institutions.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Nationwide coverage</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Sanctioned Capacity
          </div>
          <div className="text-2xl font-black text-[#1E5AE6] mt-1">
            {totalApprovedIntake.toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Total approved seats</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-600">
            High Risk Campuses
          </div>
          <div className="text-2xl font-black text-red-600 mt-1">{highRiskCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Risk score &ge; 60</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            States Represented
          </div>
          <div className="text-2xl font-black text-[#0D9488] mt-1">
            {new Set(institutions.map((i) => i.state)).size}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Geographic diversity</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Institution Name, Code, State, or City..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5AE6]/20 focus:border-[#1E5AE6] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Campuses" },
            { id: "GOVERNMENT", label: "Government" },
            { id: "GOVT_AIDED", label: "Govt. Aided" },
            { id: "PRIVATE_AUTONOMOUS", label: "Autonomous" },
            { id: "AFFILIATED", label: "Affiliated" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                filterType === type.id
                  ? "bg-[#0B1B3D] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Institution Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((inst) => {
          const instCourses = courses.filter((c) => c.institutionId === inst.id);
          const totalCapacity = instCourses.reduce((sum, c) => sum + c.approvedCapacity, 0);
          const totalEnrolled = instCourses.reduce((sum, c) => sum + c.activeEnrolment, 0);
          const hasBreach = instCourses.some((c) => c.status === "OVER_INTAKE");
          const utilPct = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

          return (
            <div
              key={inst.id}
              className={`bg-white rounded-2xl p-5 border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between ${
                hasBreach
                  ? "border-red-300 ring-2 ring-red-100"
                  : "border-slate-200/80"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-extrabold text-[#1E5AE6] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {inst.code}
                    </span>
                    <h3 className="font-black text-sm text-[#0B1B3D] mt-2 leading-snug">
                      {inst.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{inst.city}, {inst.state}</span>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                      inst.riskScore >= 60
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : inst.riskScore >= 35
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    Risk: {inst.riskScore}
                  </span>
                </div>

                {/* Institution Attributes */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Type</span>
                    <span className="font-bold text-slate-800">{inst.type.replace(/_/g, " ")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Accreditation</span>
                    <span className="font-bold text-[#1E5AE6] flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#D97706]" />
                      {inst.accreditation.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Approved Intake</span>
                    <span className="font-black text-slate-800">{inst.approvedIntakeTotal} seats</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Active Enrolled</span>
                    <span className="font-black text-[#1E5AE6]">{totalEnrolled} students</span>
                  </div>
                </div>

                {/* Utilization Progress Bar */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500 font-medium">Capacity Utilization:</span>
                    <span className={`font-bold ${utilPct > 100 ? "text-red-600" : "text-slate-800"}`}>
                      {utilPct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        utilPct > 100
                          ? "bg-red-600"
                          : utilPct >= 90
                          ? "bg-amber-500"
                          : "bg-emerald-600"
                      }`}
                      style={{ width: `${Math.min(utilPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Contact info */}
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{inst.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{inst.contactPhone}</span>
                  </div>
                </div>
              </div>

              {/* Action Button: Manage Campus Registry */}
              {onSelectInstitution && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectInstitution(inst.id)}
                    className="w-full py-2 text-xs font-bold rounded-xl bg-slate-50 hover:bg-blue-50 text-[#1E5AE6] border border-slate-200/80 hover:border-blue-200 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Inspect Campus Intake & Students</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
