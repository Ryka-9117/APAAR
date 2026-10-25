"use client";

import React, { useState } from "react";
import {
  KeyRound,
  ShieldAlert,
  Code,
  CheckCircle2,
  Copy,
  Terminal,
  ExternalLink,
  Sparkles,
  Server,
  Layers,
  Check,
  Cpu,
} from "lucide-react";

export const ApiIntegrationsView: React.FC = () => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const endpoints = [
    {
      method: "POST",
      path: "/api/students",
      title: "Submit Student Admission Record",
      desc: "Ingests an individual student admission record. Automatically triggers APAAR Luhn format validation and recalculates course intake quotas against AICTE Approval Process Handbook (APH) ceilings.",
      samplePayload: `{
  "apaarId": "9842-1234-5678",
  "institutionalStudentId": "DITS-2024-CSE-101",
  "fullName": "Aarav Sharma",
  "dob": "2003-05-14",
  "institutionId": "INST-DITS",
  "courseId": "COURSE-DITS-CSE",
  "academicYear": "2024-25",
  "admissionDate": "2024-07-15",
  "programmeMode": "FULL_TIME",
  "seatCategory": "SANCTIONED_OPEN"
}`,
      curlExample: `curl -X POST https://vidya-setu.aicte-india.org/api/students \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: aicte_inst_sec_9842f7a1" \\
  -d '{"apaarId":"9842-1234-5678","fullName":"Aarav Sharma","courseId":"COURSE-DITS-CSE","institutionId":"INST-DITS"}'`,
    },
    {
      method: "POST",
      path: "/api/apaar/verify",
      title: "Query Synthetic APAAR Registry",
      desc: "Performs format Luhn validation and checks synthetic registry for name & DOB matches. Returns confidence score and registry verification state.",
      samplePayload: `{
  "apaarId": "9842-1234-5678",
  "fullName": "Aarav Sharma",
  "dob": "2003-05-14"
}`,
      curlExample: `curl -X POST https://vidya-setu.aicte-india.org/api/apaar/verify \\
  -H "Content-Type: application/json" \\
  -d '{"apaarId":"9842-1234-5678","fullName":"Aarav Sharma"}'`,
    },
    {
      method: "POST",
      path: "/api/ingestion/upload",
      title: "Validate Batch Spreadsheet",
      desc: "Executes spreadsheet spell-checker pre-import validation on CSV/XLSX text rows without persisting. Returns row-by-row field errors and suggested corrections.",
      samplePayload: `{
  "csvContent": "apaar_id,student_full_name,dob,institution_id,course_id...",
  "fileName": "admissions_batch_01.csv",
  "institutionId": "INST-DITS"
}`,
      curlExample: `curl -X POST https://vidya-setu.aicte-india.org/api/ingestion/upload \\
  -H "Content-Type: application/json" \\
  -d '{"csvContent":"...","institutionId":"INST-DITS"}'`,
    },
    {
      method: "POST",
      path: "/api/credentials/verify",
      title: "Public Minimal Credential Verification",
      desc: "Verifies HMAC-SHA256 signature server-side and returns authenticity without exposing private student PII to the public client.",
      samplePayload: `{
  "credentialId": "CRED-VS-2024-9842"
}`,
      curlExample: `curl -X POST https://vidya-setu.aicte-india.org/api/credentials/verify \\
  -H "Content-Type: application/json" \\
  -d '{"credentialId":"CRED-VS-2024-9842"}'`,
    },
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold text-[#0B1B3D] tracking-tight">
              Institutional API & Gateway Integration Suite
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs">
              <Server className="w-3.5 h-3.5 text-teal-600" />
              RESTful v1.0 • OpenAPI 3.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Machine-to-machine integration interfaces for university student information systems (SIS), automated intake sync, and external verification gateways.
          </p>
        </div>
      </div>

      {/* Production Readiness & Architecture Notice */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200/80 text-xs text-blue-950 space-y-2.5 shadow-card">
        <div className="flex items-center gap-2 font-black text-[#1E5AE6]">
          <Cpu className="w-4 h-4" />
          <span>National Production Architecture & Extensibility Guide</span>
        </div>
        <p className="leading-relaxed text-slate-700">
          The current environment utilizes the modular <code>MockApaarVerificationProvider</code>, <code>MockSISAdapter</code>, and demonstration HMAC-SHA256 signer. In production, these interfaces are designed to be swapped with authorized DigiLocker / ABC OIDC OAuth2 connectors, National Academic Depository (NAD) endpoints, and hardware security module (HSM) signing without UI rewrites.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-blue-800 font-mono">
          <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-blue-200">
            Auth: Bearer / X-API-KEY
          </span>
          <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-blue-200">
            Rate Limit: 1,000 req/min
          </span>
          <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-blue-200">
            TLS: v1.3 Enforced
          </span>
        </div>
      </div>

      {/* Endpoints Documentation Cards */}
      <div className="space-y-5">
        {endpoints.map((ep, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-md ${
                      ep.method === "POST" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800">{ep.path}</span>
                  <span className="text-xs font-black text-[#0B1B3D]">{ep.title}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{ep.desc}</p>
              </div>

              <button
                onClick={() => handleCopy(ep.curlExample, idx)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
              >
                {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedIdx === idx ? "Copied" : "Copy cURL"}</span>
              </button>
            </div>

            {/* Code Snippets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  JSON Request Payload
                </span>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed border border-slate-800 shadow-inner">
                  {ep.samplePayload}
                </pre>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  cURL Terminal Invocation
                </span>
                <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed border border-slate-800 shadow-inner">
                  {ep.curlExample}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
