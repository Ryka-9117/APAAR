"use client";

import React, { useState } from "react";
import { Role } from "@/lib/types";
import {
  Settings,
  ShieldAlert,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Lock,
  AlertTriangle,
  UserCheck,
  Building,
  GraduationCap,
  Sparkles,
  Shield,
  FileCheck2,
} from "lucide-react";

interface SettingsViewProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  onResetData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentRole,
  onRoleChange,
  onResetData,
}) => {
  const [warningThreshold, setWarningThreshold] = useState<number>(90);
  const [overIntakePolicy, setOverIntakePolicy] = useState<"BLOCK" | "PERMIT_WITH_EXCEPTION">("PERMIT_WITH_EXCEPTION");
  const [isResetting, setIsResetting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the demonstration database to pristine seed fixtures?")) {
      return;
    }
    setIsResetting(true);
    try {
      await onResetData();
      setFeedback("Demonstration state has been successfully restored to initial seed fixtures.");
    } catch {
      setFeedback("Failed to reset demo state.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold text-[#0B1B3D] tracking-tight">
              System Policies & Demonstration Settings
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 shadow-xs">
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              Governance Configuration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure AICTE Approval Process Handbook (APH) intake ceilings, switch user personas, and reset sandbox data.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* Role Selection Settings */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-black text-[#0B1B3D] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#1E5AE6]" />
            Active Demonstration Persona & Role
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Switch between personas to test scoped institutional views, national regulatory governance, or student self-service.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1 text-xs">
          {[
            {
              id: "AICTE_ADMIN" as Role,
              label: "AICTE Super Admin",
              desc: "National analytics, regulatory breach enforcement, audit chain inspection",
              icon: Shield,
            },
            {
              id: "INSTITUTION_ADMIN" as Role,
              label: "Institutional Admin",
              desc: "Scoped to single institution, student intake management, CSV imports",
              icon: Building,
            },
            {
              id: "AUTHORIZED_VERIFIER" as Role,
              label: "Authorized Verifier",
              desc: "Scope-limited academic and regulatory status checking",
              icon: FileCheck2,
            },
            {
              id: "EMPLOYER_VERIFIER" as Role,
              label: "Employer Verifier",
              desc: "Consent-driven academic verification with student OTP authorization",
              icon: Sparkles,
            },
            {
              id: "STUDENT" as Role,
              label: "Student Demo Portal",
              desc: "Academic identity, digital credential viewer, consent approval/denial",
              icon: GraduationCap,
            },
          ].map((r) => {
            const Icon = r.icon;
            const isSelected = currentRole === r.id;

            return (
              <div
                key={r.id}
                onClick={() => onRoleChange(r.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-blue-50/70 border-[#1E5AE6] ring-2 ring-[#1E5AE6]/20 shadow-sm"
                    : "bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#0B1B3D] flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-[#1E5AE6]" : "text-slate-400"}`} />
                      {r.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#1E5AE6]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AICTE APH Intake Thresholds */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-black text-[#0B1B3D] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            AICTE Approval Process Handbook (APH) Thresholds
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic warning thresholds and over-capacity admission enforcement logic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-extrabold">
                Warning Threshold (Approaching Limit):
              </label>
              <span className="font-mono font-black text-[#0B1B3D] text-sm bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {warningThreshold}%
              </span>
            </div>
            <div className="pt-2">
              <input
                type="range"
                min={75}
                max={98}
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-[#1E5AE6] cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              Courses with active enrolments exceeding this percentage trigger automated compliance warnings in the intake monitor.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-700 font-extrabold">
              Over-Capacity Admission Action Policy:
            </label>
            <select
              aria-label="Over-Capacity Admission Policy"
              value={overIntakePolicy}
              onChange={(e) => setOverIntakePolicy(e.target.value as "BLOCK" | "PERMIT_WITH_EXCEPTION")}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5AE6]/20 focus:border-[#1E5AE6]"
            >
              <option value="PERMIT_WITH_EXCEPTION">Permit with Documented Regulatory Exception & Audit Flag</option>
              <option value="BLOCK">Strict Block (Prevent ingestion over approved intake)</option>
            </select>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Enforces whether admissions exceeding the sanctioned capacity are recorded with regulatory alerts or strictly rejected at ingestion.
            </p>
          </div>
        </div>
      </div>

      {/* Database State Management & Reset */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-black text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Demonstration Environment Reset (Sandbox)
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Restores all 12 institutions, approved intake counts, synthetic students, duplicate cases, credentials, forensics documents, and the SHA-256 hash-chain audit trail back to pristine seed fixtures.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          {isResetting ? "Restoring Pristine State..." : "Reset Demonstration Database to Pristine Seed"}
        </button>
      </div>
    </div>
  );
};
