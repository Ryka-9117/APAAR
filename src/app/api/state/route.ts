import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { verifyAuditChain } from "@/lib/crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const institutionId = searchParams.get("institutionId") || undefined;

  const institutions = store.getInstitutions();
  const courses = store.getCourses(institutionId);
  const students = store.getStudents(institutionId);
  const duplicates = store.getDuplicates(institutionId);
  const credentials = store.getCredentials(institutionId);
  const consentRequests = store.getConsentRequests();
  const forensicDocuments = store.getForensicDocuments(institutionId);
  const auditEvents = store.getAuditEvents(institutionId);
  const importBatches = store.getImportBatches(institutionId);
  const isTamperActive = store.isTamperActive();

  const auditVerification = verifyAuditChain(auditEvents);

  return NextResponse.json({
    institutions,
    courses,
    students,
    duplicates,
    credentials,
    consentRequests,
    forensicDocuments,
    auditEvents,
    importBatches,
    isTamperActive,
    auditVerification,
  });
}
