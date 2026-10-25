"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Sidebar, NavTab } from "@/components/Sidebar";
import {
  Role,
  Institution,
  Course,
  Student,
  DuplicateCase,
  StudentCredential,
  ConsentRequest,
  ForensicDocument,
  AuditEvent,
} from "@/lib/types";

// Import Views
import { OverviewView } from "@/components/views/OverviewView";
import { StudentRegistryView } from "@/components/views/StudentRegistryView";
import { BulkUploadView } from "@/components/views/BulkUploadView";
import { IntakeMonitorView } from "@/components/views/IntakeMonitorView";
import { DuplicateEnrolmentView } from "@/components/views/DuplicateEnrolmentView";
import { VerificationGatewayView } from "@/components/views/VerificationGatewayView";
import { DigitalCredentialsView } from "@/components/views/DigitalCredentialsView";
import { PublicVerifyView } from "@/components/views/PublicVerifyView";
import { EmployerConsentView } from "@/components/views/EmployerConsentView";
import { PdfForensicsView } from "@/components/views/PdfForensicsView";
import { AuditTrailView } from "@/components/views/AuditTrailView";
import { AnalyticsReportsView } from "@/components/views/AnalyticsReportsView";
import { InstitutionsView } from "@/components/views/InstitutionsView";
import { ApiIntegrationsView } from "@/components/views/ApiIntegrationsView";
import { SettingsView } from "@/components/views/SettingsView";

export default function AppHome() {
  const [currentRole, setCurrentRole] = useState<Role>("AICTE_ADMIN");
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("INST-DITS");
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);
  const [initialVerifyCredId, setInitialVerifyCredId] = useState<string | undefined>(undefined);

  // App Data State
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCase[]>([]);
  const [credentials, setCredentials] = useState<StudentCredential[]>([]);
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [forensicDocuments, setForensicDocuments] = useState<ForensicDocument[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isTamperActive, setIsTamperActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch full state from backend API
  const refreshState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json();
      if (data.institutions) setInstitutions(data.institutions);
      if (data.courses) setCourses(data.courses);
      if (data.students) setStudents(data.students);
      if (data.duplicates) setDuplicates(data.duplicates);
      if (data.credentials) setCredentials(data.credentials);
      if (data.consentRequests) setConsentRequests(data.consentRequests);
      if (data.forensicDocuments) setForensicDocuments(data.forensicDocuments);
      if (data.auditEvents) setAuditEvents(data.auditEvents);
      if (data.isTamperActive !== undefined) setIsTamperActive(data.isTamperActive);
    } catch (e) {
      console.error("Failed to load initial state:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Global Keyboard Shortcut: Ctrl/Cmd+K jumps to Registry search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCurrentTab("registry");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handler: Reset Demo Database
  const handleResetData = async () => {
    await fetch("/api/demo/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    await refreshState();
  };

  // Handler: Update Student Record
  const handleUpdateStudent = async (studentId: string, updates: Partial<Student>) => {
    await fetch(`/api/students/${studentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": currentRole,
        "x-user-id": "USER-PORTAL",
      },
      body: JSON.stringify(updates),
    });
    await refreshState();
  };

  // Handler: Verify APAAR
  const handleVerifyApaar = async (student: Student) => {
    await fetch("/api/apaar/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apaarId: student.apaarId,
        fullName: student.fullName,
        dob: student.dob,
        studentId: student.id,
      }),
    });
    await refreshState();
  };

  // Handler: Issue Credential
  const handleIssueCredential = async (student: Student) => {
    await fetch("/api/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": currentRole,
      },
      body: JSON.stringify({
        action: "ISSUE",
        studentId: student.id,
        courseId: student.courseId,
        academicYear: student.academicYear,
      }),
    });
    await refreshState();
    setCurrentTab("credentials");
  };

  // Handler: Revoke Credential
  const handleRevokeCredential = async (credentialId: string, reason: string) => {
    await fetch("/api/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": currentRole,
      },
      body: JSON.stringify({
        action: "REVOKE",
        credentialId,
        reason,
      }),
    });
    await refreshState();
  };

  // Handler: Resolve Duplicate Case
  const handleResolveDuplicate = async (
    caseId: string,
    status: DuplicateCase["reviewStatus"],
    notes: string
  ) => {
    await fetch("/api/duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId,
        reviewStatus: status,
        resolutionReason: notes,
        reviewerName: "AICTE Regulatory Directorate",
      }),
    });
    await refreshState();
  };

  // Global Search
  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    setCurrentTab("registry");
  };

  // Badges for sidebar
  const overIntakeCount = courses.filter((c) => c.status === "OVER_INTAKE").length;
  const duplicateCount = duplicates.filter((d) => d.reviewStatus === "OPEN").length;
  const pendingConsentCount = consentRequests.filter((r) => r.status === "PENDING").length;
  const forensicFlagsCount = forensicDocuments.filter(
    (f) => f.reviewStatus === "FLAGGED" || f.reviewStatus === "CONFIRMED_ANOMALY"
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] antialiased">
      {/* Persistent Application Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        institutions={institutions}
        selectedInstitutionId={selectedInstitutionId}
        onInstitutionChange={setSelectedInstitutionId}
        onResetData={handleResetData}
        onSearch={handleSearch}
        notificationCount={overIntakeCount + duplicateCount}
        onNotificationClick={() => setCurrentTab(overIntakeCount > 0 ? "intake" : "duplicates")}
        onToggleMobileMenu={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Collapsible Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          currentRole={currentRole}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          badges={{
            overIntakeCount,
            duplicateCount,
            pendingConsentCount,
            forensicFlagsCount,
          }}
        />

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-xs font-medium">
              Loading AICTE VIDYA Setu platform state...
            </div>
          ) : (
            <>
              {currentTab === "overview" && (
                <OverviewView
                  currentRole={currentRole}
                  institutions={institutions}
                  courses={courses}
                  students={students}
                  duplicates={duplicates}
                  forensics={forensicDocuments}
                  auditEvents={auditEvents}
                  selectedInstitutionId={selectedInstitutionId}
                  selectedState={selectedState}
                  onSelectState={setSelectedState}
                  onNavigateTab={(tab) => setCurrentTab(tab as NavTab)}
                />
              )}

              {currentTab === "registry" && (
                <StudentRegistryView
                  currentRole={currentRole}
                  students={students}
                  institutions={institutions}
                  courses={courses}
                  selectedInstitutionId={selectedInstitutionId}
                  onUpdateStudent={handleUpdateStudent}
                  onVerifyApaar={handleVerifyApaar}
                  onIssueCredential={handleIssueCredential}
                  onNavigateTab={(tab) => setCurrentTab(tab as NavTab)}
                />
              )}

              {currentTab === "upload" && (
                <BulkUploadView
                  institutions={institutions}
                  selectedInstitutionId={selectedInstitutionId}
                  onImportComplete={refreshState}
                  onNavigateTab={(tab) => setCurrentTab(tab as NavTab)}
                />
              )}

              {currentTab === "intake" && (
                <IntakeMonitorView
                  currentRole={currentRole}
                  courses={courses}
                  institutions={institutions}
                  selectedInstitutionId={selectedInstitutionId}
                />
              )}

              {currentTab === "duplicates" && (
                <DuplicateEnrolmentView
                  currentRole={currentRole}
                  duplicates={duplicates}
                  institutions={institutions}
                  courses={courses}
                  onResolveCase={handleResolveDuplicate}
                />
              )}

              {currentTab === "gateway" && (
                <VerificationGatewayView currentRole={currentRole} />
              )}

              {currentTab === "credentials" && (
                <DigitalCredentialsView
                  currentRole={currentRole}
                  credentials={credentials}
                  institutions={institutions}
                  onRevokeCredential={handleRevokeCredential}
                  onNavigateTab={(tab) => {
                    if (tab === "verify") {
                      setInitialVerifyCredId(credentials[0]?.id);
                    }
                    setCurrentTab(tab as NavTab);
                  }}
                />
              )}

              {currentTab === "verify" && (
                <PublicVerifyView
                  currentRole={currentRole}
                  credentials={credentials}
                  initialCredId={initialVerifyCredId}
                />
              )}

              {currentTab === "consent" && (
                <EmployerConsentView
                  currentRole={currentRole}
                  consentRequests={consentRequests}
                  credentials={credentials}
                  onRefreshState={refreshState}
                />
              )}

              {currentTab === "forensics" && (
                <PdfForensicsView
                  currentRole={currentRole}
                  documents={forensicDocuments}
                  institutions={institutions}
                  onRefreshState={refreshState}
                />
              )}

              {currentTab === "audit" && (
                <AuditTrailView
                  currentRole={currentRole}
                  auditEvents={auditEvents}
                  isTamperActive={isTamperActive}
                  onRefreshState={refreshState}
                />
              )}

              {currentTab === "analytics" && (
                <AnalyticsReportsView
                  currentRole={currentRole}
                  institutions={institutions}
                  courses={courses}
                  students={students}
                  duplicates={duplicates}
                  auditEvents={auditEvents}
                />
              )}

              {currentTab === "institutions" && (
                <InstitutionsView
                  currentRole={currentRole}
                  institutions={institutions}
                  courses={courses}
                  onSelectInstitution={(id) => {
                    setSelectedInstitutionId(id);
                    setCurrentRole("INSTITUTION_ADMIN");
                    setCurrentTab("overview");
                  }}
                />
              )}

              {currentTab === "api" && <ApiIntegrationsView />}

              {currentTab === "settings" && (
                <SettingsView
                  currentRole={currentRole}
                  onRoleChange={setCurrentRole}
                  onResetData={handleResetData}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
