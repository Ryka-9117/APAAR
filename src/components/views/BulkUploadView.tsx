"use client";

import React, { useState } from "react";
import { ImportBatch, ImportRowResult, Institution } from "@/lib/types";
import { getBlankTemplateCsv, getDemoPopulatedCsv } from "@/lib/ingestion";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Filter,
  RefreshCw,
  FileCheck,
  Sparkles,
  Lightbulb,
  FileText,
  Search,
  Check,
} from "lucide-react";

interface BulkUploadViewProps {
  institutions: Institution[];
  selectedInstitutionId?: string;
  onImportComplete?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const BulkUploadView: React.FC<BulkUploadViewProps> = ({
  institutions,
  selectedInstitutionId = "INST-DITS",
  onImportComplete,
  onNavigateTab,
}) => {
  const [csvText, setCsvText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<"ALL" | "VALID" | "WARNING" | "ERROR">("ALL");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");

  const handleDownloadBlank = () => {
    const csv = getBlankTemplateCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "AICTE_Student_Admission_Template_Blank.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDemoWithErrors = () => {
    const csv = getDemoPopulatedCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "AICTE_Demonstration_Sample_With_Validation_Errors.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadDemoIntoUploader = () => {
    const csv = getDemoPopulatedCsv();
    setCsvText(csv);
    setFileName("AICTE_Demonstration_Sample_With_Errors.csv");
    handleProcessCsv(csv, "AICTE_Demonstration_Sample_With_Errors.csv");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setCsvText(content);
      handleProcessCsv(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleProcessCsv = async (content: string, name: string) => {
    setIsValidating(true);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/ingestion/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: content,
          fileName: name,
          institutionId: selectedInstitutionId,
        }),
      });
      const data = await res.json();
      if (data.batch) {
        setBatch(data.batch);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCommitBatch = async (importOnlyValid: boolean) => {
    if (!batch) return;
    setIsCommitting(true);
    try {
      const res = await fetch("/api/ingestion/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch,
          importOnlyValid,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(
          `Successfully committed Batch #${data.batchId}! Ingested ${data.importedCount} authentic student records into AICTE Academic Registry.`
        );
        if (onImportComplete) onImportComplete();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCommitting(false);
    }
  };

  // Filtered rows for spell-checker table
  const displayedRows = (batch?.rowResults || []).filter((r) => {
    if (filterSeverity !== "ALL" && r.status !== filterSeverity) return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const raw = r.raw;
    const name = String(raw["student_full_name"] || raw["Student Full Name"] || "").toLowerCase();
    const apaar = String(raw["apaar_id"] || raw["APAAR ID"] || "").toLowerCase();
    return name.includes(q) || apaar.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold text-[#0B1B3D] tracking-tight">
              Multi-Mode Student Ingestion & Pre-Import Spell-Checker
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs">
              <Sparkles className="w-3 h-3 text-teal-600" />
              Automated Rule Validation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload institutional CSV/XLSX spreadsheets, perform row-level pre-import validation, and commit valid enrolments with zero-defect data hygiene.
          </p>
        </div>

        {/* Template Download Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleDownloadBlank}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Blank CSV Template
          </button>
          <button
            onClick={handleDownloadDemoWithErrors}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            Sample CSV (Seeded Errors)
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab("registry")}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>View in Student Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      {!batch && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 hover:border-[#1E5AE6] transition-all p-10 text-center shadow-card">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1E5AE6] border border-blue-200 flex items-center justify-center mx-auto shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0B1B3D]">
                Drag and drop your student admissions spreadsheet
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Supports CSV, XLSX with standard AICTE columns: APAAR ID, Student Name, Course, DOB, and Seat Category.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">.CSV</span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">.XLSX</span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">UTF-8</span>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-[#1E5AE6] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors">
                Browse Spreadsheet File
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleLoadDemoIntoUploader}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors border border-slate-300"
              >
                Load Pre-Populated Demo File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet Spell-Checker Validation Panel */}
      {batch && (
        <div className="space-y-4 animate-in fade-in">
          {/* Batch Summary Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Batch Validation Spell-Checker: #{batch.id}
              </span>
              <h2 className="text-base font-black text-[#0B1B3D] flex items-center gap-2 mt-0.5">
                <FileSpreadsheet className="w-5 h-5 text-[#1E5AE6]" />
                {batch.fileName}
              </h2>
            </div>

            {/* Validation Metrics */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="flex items-center gap-1.5 font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {batch.validRows} Valid
              </span>
              <span className="flex items-center gap-1.5 font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> {batch.warningRows} Warnings
              </span>
              <span className="flex items-center gap-1.5 font-black text-red-800 bg-red-50 px-3 py-1 rounded-xl border border-red-200">
                <XCircle className="w-4 h-4 text-red-600" /> {batch.errorRows} Errors
              </span>
            </div>

            {/* Import Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setBatch(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
              >
                Upload Different File
              </button>
              <button
                onClick={() => handleCommitBatch(true)}
                disabled={isCommitting || batch.validRows === 0}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#1E5AE6] hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCommitting ? "Importing Records..." : `Import Valid (${batch.validRows}) Records`}
              </button>
            </div>
          </div>

          {/* Spell-Checker Row Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <span className="text-slate-500 font-bold text-[11px] mr-1">Filter:</span>
              <button
                onClick={() => setFilterSeverity("ALL")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  filterSeverity === "ALL" ? "bg-[#0B1B3D] text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                All Rows ({batch.totalRows})
              </button>
              <button
                onClick={() => setFilterSeverity("ERROR")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  filterSeverity === "ERROR" ? "bg-red-600 text-white shadow-xs" : "bg-white text-red-700 border border-red-200"
                }`}
              >
                Errors ({batch.errorRows})
              </button>
              <button
                onClick={() => setFilterSeverity("WARNING")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  filterSeverity === "WARNING" ? "bg-amber-500 text-white shadow-xs" : "bg-white text-amber-700 border border-amber-200"
                }`}
              >
                Warnings ({batch.warningRows})
              </button>
              <button
                onClick={() => setFilterSeverity("VALID")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  filterSeverity === "VALID" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-emerald-700 border border-emerald-200"
                }`}
              >
                Valid ({batch.validRows})
              </button>
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search row by student name or APAAR..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5AE6]/20 focus:border-[#1E5AE6]"
              />
            </div>
          </div>

          {/* Row-Level Spell-Checker Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                <tr>
                  <th className="py-3 px-3.5 w-16">Row #</th>
                  <th className="py-3 px-3.5">Student & APAAR</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Identified Issue</th>
                  <th className="py-3 px-3.5">AICTE Suggested Fix</th>
                  <th className="py-3 px-3.5 text-right">Importable?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRows.map((r) => {
                  const raw = r.raw;
                  const name = raw["student_full_name"] || raw["Student Full Name"] || "Unknown Name";
                  const apaar = raw["apaar_id"] || raw["APAAR ID"] || "Missing";

                  return (
                    <tr
                      key={r.rowNumber}
                      className={`transition-colors ${
                        r.status === "ERROR"
                          ? "bg-red-50/40 hover:bg-red-50/70"
                          : r.status === "WARNING"
                          ? "bg-amber-50/30 hover:bg-amber-50/60"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-500">
                        #{r.rowNumber}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-extrabold text-[#0B1B3D] block">{name}</span>
                        <span className="font-mono text-[11px] text-slate-500">{apaar}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        {r.status === "VALID" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid
                          </span>
                        )}
                        {r.status === "WARNING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Warning
                          </span>
                        )}
                        {r.status === "ERROR" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-800 border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" /> Error
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        {r.fieldErrors.length === 0 ? (
                          <span className="text-slate-400 font-medium">All fields valid</span>
                        ) : (
                          <div className="space-y-1">
                            {r.fieldErrors.map((err, idx) => (
                              <div key={idx} className="text-[11px]">
                                <span className="font-mono font-bold text-slate-700">[{err.field}]</span>:{" "}
                                <span className={err.severity === "ERROR" ? "text-red-700 font-bold" : "text-amber-800 font-medium"}>
                                  {err.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        {r.fieldErrors.map((err, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="italic">{err.suggestedFix || "No correction required"}</span>
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-3.5 text-right font-black">
                        {r.canImport ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            PERMITTED
                          </span>
                        ) : (
                          <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[10px]">
                            BLOCKED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
