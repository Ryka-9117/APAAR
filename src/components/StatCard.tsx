"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger" | "teal" | "neutral";
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "neutral",
  trend,
  onClick,
  badge,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          iconBg: "bg-blue-50 text-[#1E5AE6] ring-1 ring-blue-100",
          border: "border-slate-200/80 hover:border-blue-300",
          accent: "bg-[#1E5AE6]",
        };
      case "teal":
        return {
          iconBg: "bg-teal-50 text-[#0D9488] ring-1 ring-teal-100",
          border: "border-slate-200/80 hover:border-teal-300",
          accent: "bg-[#0D9488]",
        };
      case "success":
        return {
          iconBg: "bg-emerald-50 text-[#059669] ring-1 ring-emerald-100",
          border: "border-slate-200/80 hover:border-emerald-300",
          accent: "bg-[#059669]",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 text-[#D97706] ring-1 ring-amber-100",
          border: "border-amber-200/80 hover:border-amber-400 bg-amber-50/20",
          accent: "bg-[#D97706]",
        };
      case "danger":
        return {
          iconBg: "bg-red-50 text-[#DC2626] ring-1 ring-red-100",
          border: "border-red-200/80 hover:border-red-400 bg-red-50/20",
          accent: "bg-[#DC2626]",
        };
      case "neutral":
      default:
        return {
          iconBg: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
          border: "border-slate-200/80 hover:border-slate-300",
          accent: "bg-slate-400",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group relative bg-white rounded-xl p-4 sm:p-5 border shadow-card transition-all duration-200 ${styles.border} ${
        onClick
          ? "cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              {title}
            </span>
            {badge && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight tabular-nums">
            {value}
          </div>
        </div>
        <div
          className={`p-2.5 rounded-xl transition-transform duration-200 shrink-0 ${styles.iconBg} ${
            onClick ? "group-hover:scale-105" : ""
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
          {subtitle && (
            <span className="truncate font-medium text-slate-500 text-[11px]">
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={`font-semibold ml-auto shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                trend.isPositive
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
                  : "bg-red-50 text-red-700 ring-1 ring-red-200/60"
              }`}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{trend.value}</span>
              {trend.label && (
                <span className="text-slate-400 font-normal ml-0.5">
                  {trend.label}
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
