"use client";

import React from "react";
import { Institution, Course } from "@/lib/types";
import { MapPin, AlertCircle, Building2, TrendingUp, CheckCircle, X } from "lucide-react";

interface StateHeatmapProps {
  institutions: Institution[];
  courses: Course[];
  selectedState?: string;
  onSelectState: (state?: string) => void;
}

interface StateAggregate {
  name: string;
  code: string;
  institutionCount: number;
  approvedIntake: number;
  activeEnrolment: number;
  utilizationPct: number;
  overIntakeCount: number;
  warningCount: number;
  avgRisk: number;
}

export const StateHeatmap: React.FC<StateHeatmapProps> = ({
  institutions,
  courses,
  selectedState,
  onSelectState,
}) => {
  // Aggregate state metrics
  const stateMap = new Map<string, StateAggregate>();

  for (const inst of institutions) {
    const sName = inst.state;
    const instCourses = courses.filter((c) => c.institutionId === inst.id);
    const approved = instCourses.reduce((sum, c) => sum + c.approvedCapacity, 0);
    const enrolled = instCourses.reduce((sum, c) => sum + c.activeEnrolment, 0);
    const over = instCourses.filter((c) => c.status === "OVER_INTAKE").length;
    const warn = instCourses.filter((c) => c.status === "WARNING").length;

    const existing = stateMap.get(sName) || {
      name: sName,
      code: sName.slice(0, 2).toUpperCase(),
      institutionCount: 0,
      approvedIntake: 0,
      activeEnrolment: 0,
      utilizationPct: 0,
      overIntakeCount: 0,
      warningCount: 0,
      avgRisk: 0,
    };

    existing.institutionCount += 1;
    existing.approvedIntake += approved;
    existing.activeEnrolment += enrolled;
    existing.overIntakeCount += over;
    existing.warningCount += warn;
    existing.avgRisk = (existing.avgRisk + inst.riskScore) / existing.institutionCount;

    stateMap.set(sName, existing);
  }

  // Calculate percentages
  const states = Array.from(stateMap.values()).map((s) => ({
    ...s,
    utilizationPct:
      s.approvedIntake > 0
        ? Number(((s.activeEnrolment / s.approvedIntake) * 100).toFixed(1))
        : 0,
  }));

  // Sort: States with breaches first, then highest utilization
  states.sort((a, b) => {
    if (b.overIntakeCount !== a.overIntakeCount) {
      return b.overIntakeCount - a.overIntakeCount;
    }
    return b.utilizationPct - a.utilizationPct;
  });

  const getHeatmapColor = (utilization: number, overCount: number) => {
    if (overCount > 0) return { bg: "bg-red-500", text: "text-white", bar: "bg-red-500", light: "bg-red-50 text-red-700 ring-1 ring-red-200" };
    if (utilization >= 90) return { bg: "bg-amber-500", text: "text-slate-950", bar: "bg-amber-500", light: "bg-amber-50 text-amber-800 ring-1 ring-amber-200" };
    if (utilization >= 75) return { bg: "bg-blue-600", text: "text-white", bar: "bg-blue-600", light: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" };
    return { bg: "bg-teal-600", text: "text-white", bar: "bg-teal-600", light: "bg-teal-50 text-teal-700 ring-1 ring-teal-200" };
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <MapPin className="w-4 h-4" />
            </div>
            <span>National Geographic State Distribution & Intake Allotment</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time state-level aggregation of technical education capacity, active admissions, and regulatory breaches.
          </p>
        </div>
        {selectedState && (
          <button
            onClick={() => onSelectState(undefined)}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-lg font-semibold transition-colors self-start sm:self-auto border border-blue-200"
          >
            <span>State: {selectedState}</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* State Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 mt-4">
        {states.map((st) => {
          const isSelected = selectedState === st.name;
          const colorMeta = getHeatmapColor(st.utilizationPct, st.overIntakeCount);

          return (
            <div
              key={st.name}
              onClick={() => onSelectState(isSelected ? undefined : st.name)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 relative group ${
                isSelected
                  ? "ring-2 ring-blue-600 bg-blue-50/60 border-blue-500 shadow-sm"
                  : "bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-card border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-bold text-xs text-slate-900 truncate">
                  {st.name}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${colorMeta.light}`}
                >
                  {st.utilizationPct}%
                </span>
              </div>

              {/* Mini Utilization Bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorMeta.bar}`}
                  style={{ width: `${Math.min(st.utilizationPct, 100)}%` }}
                />
              </div>

              <div className="mt-2.5 space-y-1 text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span>Campuses:</span>
                  <span className="font-bold text-slate-800">{st.institutionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Admissions:</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {st.activeEnrolment}/{st.approvedIntake}
                  </span>
                </div>
              </div>

              {/* Status Alert Badge */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                {st.overIntakeCount > 0 ? (
                  <span className="text-red-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span>{st.overIntakeCount} Breach</span>
                  </span>
                ) : st.warningCount > 0 ? (
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-amber-500" />
                    <span>{st.warningCount} Near Cap</span>
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span>Normal</span>
                  </span>
                )}
                <span className="text-slate-400 font-mono text-[9px] tabular-nums">
                  Risk {Math.round(st.avgRisk)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Heatmap Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <span className="font-semibold text-slate-700">Capacity Utilization Bands:</span>
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <span>&lt; 75% Optimal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>75–89% Stable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>90–99% Warning (Near Cap)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>&ge; 100% Capacity / Over-Intake</span>
          </div>
        </div>
      </div>
    </div>
  );
};
