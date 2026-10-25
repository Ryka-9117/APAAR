"use client";

import React, { useState } from "react";
import { Role } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  Gauge,
  CopyCheck,
  ShieldCheck,
  Award,
  QrCode,
  FileCheck2,
  FileSearch,
  History,
  BarChart3,
  Building2,
  KeyRound,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export type NavTab =
  | "overview"
  | "registry"
  | "upload"
  | "intake"
  | "duplicates"
  | "gateway"
  | "credentials"
  | "verify"
  | "consent"
  | "forensics"
  | "audit"
  | "analytics"
  | "institutions"
  | "api"
  | "settings";

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentRole: Role;
  collapsed: boolean;
  onToggleCollapse: () => void;
  badges?: {
    overIntakeCount?: number;
    duplicateCount?: number;
    pendingConsentCount?: number;
    forensicFlagsCount?: number;
  };
}

interface NavItemDef {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
  badgeLabel?: string;
}

interface NavSection {
  title: string;
  items: NavItemDef[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  currentRole,
  collapsed,
  onToggleCollapse,
  badges = {},
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const sections: NavSection[] = [
    {
      title: "Core Governance",
      items: [
        { id: "overview", label: "National Overview", icon: LayoutDashboard },
        { id: "registry", label: "Student Registry", icon: Users },
        {
          id: "intake",
          label: "Live Intake Guard",
          icon: Gauge,
          badge: badges.overIntakeCount && badges.overIntakeCount > 0 ? badges.overIntakeCount : undefined,
          badgeColor: "bg-red-500 text-white ring-1 ring-red-400/40",
          badgeLabel: "Breaches",
        },
        { id: "institutions", label: "Approved Campuses", icon: Building2 },
      ],
    },
    {
      title: "Regulatory Intelligence",
      items: [
        {
          id: "duplicates",
          label: "Duplicate Enrolments",
          icon: CopyCheck,
          badge: badges.duplicateCount && badges.duplicateCount > 0 ? badges.duplicateCount : undefined,
          badgeColor: "bg-amber-500 text-slate-950 font-extrabold ring-1 ring-amber-400/40",
          badgeLabel: "Alerts",
        },
        {
          id: "forensics",
          label: "PDF Digital Forensics",
          icon: FileSearch,
          badge: badges.forensicFlagsCount && badges.forensicFlagsCount > 0 ? badges.forensicFlagsCount : undefined,
          badgeColor: "bg-purple-500 text-white ring-1 ring-purple-400/40",
          badgeLabel: "Flags",
        },
        { id: "audit", label: "SHA-256 Audit Chain", icon: History },
        { id: "analytics", label: "Reports & Exports", icon: BarChart3 },
      ],
    },
    {
      title: "Verification & Trust",
      items: [
        { id: "gateway", label: "Verification Gateway", icon: ShieldCheck },
        { id: "credentials", label: "Digital Credentials", icon: Award },
        { id: "verify", label: "QR Public Verify", icon: QrCode },
        {
          id: "consent",
          label: "Employer Consent",
          icon: FileCheck2,
          badge: badges.pendingConsentCount && badges.pendingConsentCount > 0 ? badges.pendingConsentCount : undefined,
          badgeColor: "bg-teal-500 text-white ring-1 ring-teal-400/40",
          badgeLabel: "Pending",
        },
      ],
    },
    {
      title: "Data & Admin",
      items: [
        { id: "upload", label: "Bulk Data Ingestion", icon: UploadCloud },
        { id: "api", label: "API Integrations", icon: KeyRound },
        { id: "settings", label: "Platform Policies", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-[#0A192F] text-slate-300 border-r border-slate-800/90 transition-all duration-200 select-none shrink-0 z-20 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Navigation Groups List */}
      <nav className="flex-1 py-4 px-2.5 space-y-5 overflow-y-auto overflow-x-hidden">
        {sections.map((section, sIdx) => (
          <div key={section.title} className="space-y-1">
            {!collapsed ? (
              <div className="px-3 pt-1 pb-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400/80 flex items-center justify-between">
                <span>{section.title}</span>
                <span className="w-8 h-[1px] bg-slate-800"></span>
              </div>
            ) : (
              sIdx > 0 && <div className="my-2 mx-2 border-t border-slate-800" />
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                        isActive
                          ? "bg-[#1E5AE6] text-white shadow-sm font-semibold"
                          : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                    >
                      {/* Active Left Indicator */}
                      {isActive && !collapsed && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full" />
                      )}

                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-white group-hover:scale-105"
                        }`}
                      />

                      {!collapsed && (
                        <span className="flex-1 text-left truncate tracking-tight text-[12px]">
                          {item.label}
                        </span>
                      )}

                      {!collapsed && item.badge !== undefined && (
                        <span
                          className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            item.badgeColor || "bg-blue-600 text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Collapsed Mode Floating Hover Tooltip */}
                    {collapsed && hoveredItem === item.id && (
                      <div className="fixed left-[76px] z-50 bg-[#0F244A] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-premium border border-slate-700 whitespace-nowrap flex items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        <span>{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              item.badgeColor || "bg-blue-600 text-white"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800/90 bg-[#071324] flex items-center justify-between gap-2">
        {!collapsed && (
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>AICTE APH 2024-25</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
          className={`p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors ${
            collapsed ? "mx-auto" : "ml-auto"
          }`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
