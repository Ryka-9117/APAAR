"use client";

import React, { useState } from "react";
import { Role, Institution } from "@/lib/types";
import {
  ShieldAlert,
  Search,
  Bell,
  RefreshCw,
  UserCheck,
  Building2,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  X,
  ShieldCheck,
  Sparkles,
  Command,
  ChevronDown,
  Menu,
} from "lucide-react";

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  institutions: Institution[];
  selectedInstitutionId?: string;
  onInstitutionChange: (id: string) => void;
  onResetData: () => Promise<void>;
  onSearch: (query: string) => void;
  notificationCount?: number;
  onNotificationClick: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  institutions,
  selectedInstitutionId,
  onInstitutionChange,
  onResetData,
  onSearch,
  notificationCount = 3,
  onNotificationClick,
  onToggleMobileMenu,
}) => {
  const [searchVal, setSearchVal] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDisclaimerDetails, setShowDisclaimerDetails] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
  };

  const handleResetExecute = async () => {
    setIsResetting(true);
    await onResetData();
    setIsResetting(false);
    setShowResetConfirm(false);
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "AICTE_ADMIN":
        return {
          label: "AICTE Super Administrator",
          shortLabel: "AICTE Admin",
          color: "bg-blue-600/20 text-blue-300 border-blue-500/40",
          icon: ShieldAlert,
        };
      case "INSTITUTION_ADMIN":
        return {
          label: "Institutional Administrator",
          shortLabel: "Inst. Admin",
          color: "bg-teal-600/20 text-teal-300 border-teal-500/40",
          icon: Building2,
        };
      case "AUTHORIZED_VERIFIER":
        return {
          label: "Authorized Verifier",
          shortLabel: "Verifier",
          color: "bg-purple-600/20 text-purple-300 border-purple-500/40",
          icon: UserCheck,
        };
      case "EMPLOYER_VERIFIER":
        return {
          label: "Employer Verifier",
          shortLabel: "Employer",
          color: "bg-amber-600/20 text-amber-300 border-amber-500/40",
          icon: Briefcase,
        };
      case "STUDENT":
        return {
          label: "Student Demo Portal",
          shortLabel: "Student",
          color: "bg-emerald-600/20 text-emerald-300 border-emerald-500/40",
          icon: GraduationCap,
        };
    }
  };

  const roleMeta = getRoleBadge(currentRole);
  const RoleIcon = roleMeta.icon;

  return (
    <header className="sticky top-0 z-30 flex flex-col bg-[#071324] text-white border-b border-slate-800 shadow-md">
      {/* 1. Sovereign Government Banner with Elegant Demo Sandbox Indicator */}
      <div className="bg-[#0A1A33] border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-[11px] font-medium text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200 tracking-wide uppercase text-[10px] hidden sm:inline">
            Government of India • Ministry of Education
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 text-[10px]">
            All India Council for Technical Education (AICTE)
          </span>
        </div>

        {/* Demo Sandbox Alert Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDisclaimerDetails(!showDisclaimerDetails)}
            className="flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full hover:bg-amber-500/25 transition-colors cursor-pointer"
            title="Click to view simulated data disclaimer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Demo Sandbox</span>
            <span className="text-amber-400/80 text-[10px] hidden md:inline">
              — Simulated APAAR & APH Data
            </span>
          </button>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-3 shrink-0">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Sovereign Emblem Stamp */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E5AE6] to-[#0F244A] flex items-center justify-center text-white font-black text-base shadow-inner border border-blue-400/30">
            VS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base lg:text-lg tracking-tight text-white flex items-center gap-1.5">
                <span>विद्या सेतु</span>
                <span className="text-slate-400 font-light text-sm">|</span>
                <span className="text-blue-400">VIDYA SETU</span>
              </span>
              <span className="text-[9px] uppercase font-extrabold tracking-widest px-1.5 py-0.5 rounded bg-[#0D9488] text-white shadow-sm">
                AICTE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight leading-none mt-0.5 hidden sm:block">
              APAAR Student Intelligence & Regulatory Verification Platform
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex items-center flex-1 max-w-md mx-2 relative group"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search APAAR ID, Student, Institution, or Course..."
              className="w-full pl-9 pr-14 py-2 text-xs rounded-lg bg-[#0F244A]/90 text-slate-100 placeholder-slate-400 border border-slate-700/80 focus:outline-none focus:border-[#1E5AE6] focus:ring-2 focus:ring-[#1E5AE6]/30 transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 group-focus-within:text-blue-400 transition-colors" />
            <div className="absolute right-2.5 top-2 flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </div>
        </form>

        {/* Header Controls & Quick Switchers */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Institution Scoper (visible when role is INSTITUTION_ADMIN) */}
          {currentRole === "INSTITUTION_ADMIN" && (
            <div className="flex items-center gap-1.5 bg-[#0F244A] px-2.5 py-1.5 rounded-lg border border-teal-500/40 text-xs">
              <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-wider text-teal-300/80 font-bold leading-none">
                  Active Scope
                </span>
                <select
                  aria-label="Active Scope Institution"
                  value={selectedInstitutionId || "INST-DITS"}
                  onChange={(e) => onInstitutionChange(e.target.value)}
                  className="bg-transparent text-xs text-slate-100 font-medium focus:outline-none cursor-pointer max-w-[150px] lg:max-w-[200px] truncate"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id} className="bg-[#071324] text-slate-100">
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Role Switcher Pill */}
          <div className="flex items-center gap-2 bg-[#0F244A] px-2.5 py-1.5 rounded-lg border border-slate-700/80">
            <RoleIcon className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold leading-none">
                Demo Persona
              </span>
              <select
                aria-label="Active Demo Role"
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as Role)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="AICTE_ADMIN" className="bg-[#071324] text-slate-100">AICTE Super Admin</option>
                <option value="INSTITUTION_ADMIN" className="bg-[#071324] text-slate-100">Institutional Admin</option>
                <option value="AUTHORIZED_VERIFIER" className="bg-[#071324] text-slate-100">Authorized Verifier</option>
                <option value="EMPLOYER_VERIFIER" className="bg-[#071324] text-slate-100">Employer Verifier</option>
                <option value="STUDENT" className="bg-[#071324] text-slate-100">Student Portal</option>
              </select>
            </div>
          </div>

          {/* Notification Button */}
          <button
            onClick={onNotificationClick}
            aria-label="View notifications"
            className="relative p-2 rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
            title="System Regulatory Alerts"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            aria-label="Reset Demo Database"
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors shadow-sm"
            title="Reset demonstration state to pristine seed fixtures"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-medium">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Expanded Disclaimer Details Modal / Banner */}
      {showDisclaimerDetails && (
        <div className="bg-[#0F244A] border-b border-amber-500/30 px-4 py-2.5 text-xs text-slate-200 flex items-start justify-between gap-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">DEMO ENVIRONMENT NOTICE:</strong>
              <span className="ml-1 text-slate-300">
                All student identities, APAAR numbers, institutional records, and credentials displayed in this platform are simulated for demonstration purposes. This system operates against local deterministic storage and does not connect to live production databases.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowDisclaimerDetails(false)}
            className="text-slate-400 hover:text-white shrink-0 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-amber-600 font-bold text-base">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span>Reset Demonstration Database?</span>
              </div>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              This will restore all 12 institutions, approved intake counts, 150+ student records, cross-institution duplicate cases, credentials, forensics documents, and the SHA-256 hash-chain audit trail back to pristine deterministic seed fixtures.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetExecute}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#DC2626] hover:bg-red-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting State...</span>
                  </>
                ) : (
                  <span>Confirm & Reset Data</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
