import fs from "fs";
import path from "path";
import {
  Role,
  Institution,
  Course,
  Student,
  DuplicateCase,
  StudentCredential,
  ConsentRequest,
  AuditEvent,
  ForensicDocument,
  ImportBatch,
} from "./types";
import { generateSeedData, SeedData } from "./seed";
import { computeAuditEventHash, signCredentialPayload, verifyAuditChain } from "./crypto";
import { calculateCourseIntake } from "./intake";
import { scanCrossInstitutionDuplicates } from "./duplicates";
import { analyzeDocumentForensics } from "./forensics";
import { normalizeApaarId, formatApaarId } from "./apaar";

export interface AppState extends SeedData {
  importBatches: ImportBatch[];
  tamperSimulationActive: boolean;
  tamperedEventBackup?: AuditEvent;
}

class VidyaSetuStore {
  private state: AppState;
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), "data", "store.json");
    this.state = this.loadOrInitialize();
  }

  private loadOrInitialize(): AppState {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not load stored data, falling back to seed:", e);
    }

    const seed = generateSeedData();
    const initial: AppState = {
      ...seed,
      importBatches: [],
      tamperSimulationActive: false,
    };
    this.persist(initial);
    return initial;
  }

  private persist(state: AppState): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(state, null, 2), "utf8");
    } catch (e) {
      console.warn("Failed to persist store state to disk:", e);
    }
  }

  public resetDemoData(): void {
    const seed = generateSeedData();
    this.state = {
      ...seed,
      importBatches: [],
      tamperSimulationActive: false,
    };
    this.persist(this.state);
  }

  // State Getters
  public getInstitutions(): Institution[] {
    return this.state.institutions;
  }

  public getInstitutionById(id: string): Institution | undefined {
    return this.state.institutions.find((i) => i.id === id);
  }

  public getCourses(institutionId?: string): Course[] {
    if (institutionId) {
      return this.state.courses.filter((c) => c.institutionId === institutionId);
    }
    return this.state.courses;
  }

  public getCourseById(id: string): Course | undefined {
    return this.state.courses.find((c) => c.id === id);
  }

  public getStudents(institutionId?: string): Student[] {
    if (institutionId) {
      return this.state.students.filter((s) => s.institutionId === institutionId);
    }
    return this.state.students;
  }

  public getStudentById(id: string): Student | undefined {
    return this.state.students.find((s) => s.id === id);
  }

  public getDuplicates(institutionId?: string): DuplicateCase[] {
    if (institutionId) {
      return this.state.duplicates.filter(
        (d) => d.institutionAId === institutionId || d.institutionBId === institutionId
      );
    }
    return this.state.duplicates;
  }

  public getDuplicateById(id: string): DuplicateCase | undefined {
    return this.state.duplicates.find((d) => d.id === id);
  }

  public getCredentials(institutionId?: string, studentId?: string): StudentCredential[] {
    let list = this.state.credentials;
    if (institutionId) {
      list = list.filter((c) => c.issuingInstitutionId === institutionId);
    }
    if (studentId) {
      list = list.filter((c) => c.studentId === studentId);
    }
    return list;
  }

  public getCredentialById(id: string): StudentCredential | undefined {
    return this.state.credentials.find((c) => c.id === id);
  }

  public getConsentRequests(studentId?: string): ConsentRequest[] {
    if (studentId) {
      return this.state.consentRequests.filter((r) => r.studentId === studentId);
    }
    return this.state.consentRequests;
  }

  public getConsentRequestById(id: string): ConsentRequest | undefined {
    return this.state.consentRequests.find((r) => r.id === id);
  }

  public getForensicDocuments(institutionId?: string): ForensicDocument[] {
    if (institutionId) {
      return this.state.forensicDocuments.filter((d) => d.institutionId === institutionId);
    }
    return this.state.forensicDocuments;
  }

  public getAuditEvents(institutionId?: string): AuditEvent[] {
    if (institutionId) {
      return this.state.auditEvents.filter(
        (e) => !e.institutionId || e.institutionId === institutionId
      );
    }
    return this.state.auditEvents;
  }

  public getImportBatches(institutionId?: string): ImportBatch[] {
    if (institutionId) {
      return this.state.importBatches.filter((b) => b.institutionId === institutionId);
    }
    return this.state.importBatches;
  }

  public isTamperActive(): boolean {
    return this.state.tamperSimulationActive;
  }

  // Mutations with Hash Chain Auditing
  public addAuditEvent(
    actorId: string,
    actorRole: Role,
    actorName: string,
    actionType: string,
    targetEntity: string,
    targetReference: string,
    result: "SUCCESS" | "FAILURE" | "DENIED",
    metadata: Record<string, unknown> = {},
    institutionId?: string
  ): AuditEvent {
    const events = this.state.auditEvents;
    const lastEvent = events.length > 0 ? events[events.length - 1] : null;
    const prevHash = lastEvent ? lastEvent.currentHash : "0".repeat(64);
    const eventNumber = events.length + 1;
    const id = `EVT-${String(eventNumber).padStart(3, "0")}`;
    const timestamp = new Date().toISOString();

    const rawEvent = {
      id,
      eventNumber,
      timestamp,
      actorId,
      actorRole,
      actorName,
      institutionId,
      actionType,
      targetEntity,
      targetReference,
      result,
      metadata,
      previousHash: prevHash,
    };

    const currentHash = computeAuditEventHash(rawEvent);
    const completeEvent: AuditEvent = { ...rawEvent, currentHash };

    this.state.auditEvents.push(completeEvent);
    this.persist(this.state);
    return completeEvent;
  }

  public recalculateCourseCapacity(courseId: string): void {
    const course = this.state.courses.find((c) => c.id === courseId);
    if (!course) return;

    // Count active students enrolled in this course
    const activeStudents = this.state.students.filter(
      (s) => s.courseId === courseId && s.enrolmentStatus === "ACTIVE"
    );

    // Sanctioned vs supernumerary counting
    const sanctionedStudents = activeStudents.filter(
      (s) => !["TFW", "EWS", "PMSSS", "NRI_OCI_FN", "LATERAL_ENTRY"].includes(s.seatCategory)
    );
    course.activeEnrolment = sanctionedStudents.length;

    course.supernumeraryEnrolled = {
      tfw: activeStudents.filter((s) => s.seatCategory === "TFW").length,
      ews: activeStudents.filter((s) => s.seatCategory === "EWS").length,
      nriOciFn: activeStudents.filter((s) => s.seatCategory === "NRI_OCI_FN").length,
      pmsss: activeStudents.filter((s) => s.seatCategory === "PMSSS").length,
      lateralEntry: activeStudents.filter((s) => s.seatCategory === "LATERAL_ENTRY").length,
    };

    const calc = calculateCourseIntake(course);
    course.utilizationPct = calc.utilizationPct;
    course.status = calc.status;
    course.lastAuditTimestamp = new Date().toISOString();
  }

  public addStudent(
    studentData: Omit<Student, "id" | "lastUpdated">,
    actorId: string,
    actorRole: Role,
    actorName: string
  ): Student {
    const id = `STU-${1000 + this.state.students.length + 1}`;
    const student: Student = {
      ...studentData,
      id,
      apaarNormalized: normalizeApaarId(studentData.apaarId),
      apaarId: formatApaarId(studentData.apaarId),
      lastUpdated: new Date().toISOString(),
    };

    this.state.students.push(student);

    // Recalculate intake for course
    this.recalculateCourseCapacity(student.courseId);

    // Run duplicate detection
    const newCases = scanCrossInstitutionDuplicates(this.state.students);
    this.state.duplicates = newCases;

    // Record audit event
    this.addAuditEvent(
      actorId,
      actorRole,
      actorName,
      "STUDENT_RECORD_CREATED",
      "STUDENT_RECORD",
      student.id,
      "SUCCESS",
      {
        fullName: student.fullName,
        apaarNormalized: student.apaarNormalized,
        courseId: student.courseId,
        seatCategory: student.seatCategory,
      },
      student.institutionId
    );

    this.persist(this.state);
    return student;
  }

  public updateStudent(
    studentId: string,
    updates: Partial<Student>,
    actorId: string,
    actorRole: Role,
    actorName: string
  ): Student | null {
    const student = this.state.students.find((s) => s.id === studentId);
    if (!student) return null;

    const oldCourse = student.courseId;
    Object.assign(student, updates);
    if (updates.apaarId) {
      student.apaarNormalized = normalizeApaarId(updates.apaarId);
      student.apaarId = formatApaarId(updates.apaarId);
    }
    student.lastUpdated = new Date().toISOString();

    // Recalculate intake
    this.recalculateCourseCapacity(student.courseId);
    if (oldCourse !== student.courseId) {
      this.recalculateCourseCapacity(oldCourse);
    }

    // Refresh duplicates
    this.state.duplicates = scanCrossInstitutionDuplicates(this.state.students);

    this.addAuditEvent(
      actorId,
      actorRole,
      actorName,
      "STUDENT_RECORD_UPDATED",
      "STUDENT_RECORD",
      student.id,
      "SUCCESS",
      updates,
      student.institutionId
    );

    this.persist(this.state);
    return student;
  }

  public updateDuplicateStatus(
    caseId: string,
    reviewStatus: DuplicateCase["reviewStatus"],
    resolutionReason: string,
    reviewerName: string
  ): DuplicateCase | null {
    const dup = this.state.duplicates.find((d) => d.id === caseId);
    if (!dup) return null;

    dup.reviewStatus = reviewStatus;
    dup.resolutionReason = resolutionReason;
    dup.assignedReviewer = reviewerName;
    dup.investigationHistory.push({
      timestamp: new Date().toISOString(),
      actor: reviewerName,
      action: reviewStatus,
      notes: resolutionReason,
    });

    this.addAuditEvent(
      "AICTE-REV-OFFICER",
      "AICTE_ADMIN",
      reviewerName,
      "DUPLICATE_CASE_RESOLVED",
      "DUPLICATE_CASE",
      caseId,
      "SUCCESS",
      { reviewStatus, resolutionReason }
    );

    this.persist(this.state);
    return dup;
  }

  public issueCredential(
    studentId: string,
    courseId: string,
    academicYear: string,
    actorId: string,
    actorRole: Role,
    actorName: string
  ): StudentCredential | null {
    const student = this.state.students.find((s) => s.id === studentId);
    if (!student) return null;

    const inst = this.state.institutions.find((i) => i.id === student.institutionId);
    const course = this.state.courses.find((c) => c.id === courseId);

    const credentialNumber = `VS-CRED-${academicYear.slice(0, 4)}-${student.apaarNormalized.slice(-4)}`;
    const id = `CRED-${credentialNumber}`;

    const payload: StudentCredential["payload"] = {
      studentId: student.id,
      studentName: student.fullName,
      maskedApaar: `••••-••••-${student.apaarNormalized.slice(8, 12)}`,
      institutionalStudentId: student.institutionalStudentId,
      institutionName: inst ? inst.name : "AICTE Institution",
      courseName: course ? course.name : "Engineering Programme",
      academicYear,
      cgpa: 8.85,
      completionStatus: student.enrolmentStatus === "COMPLETED" ? "GRADUATED_AUTHENTIC" : "ENROLLED_AUTHENTIC",
    };

    const signature = signCredentialPayload(payload);
    const now = new Date();
    const expiry = new Date();
    expiry.setFullYear(now.getFullYear() + 4);

    const credential: StudentCredential = {
      id,
      studentId: student.id,
      credentialNumber,
      issuingInstitutionId: student.institutionId,
      courseId,
      academicYear,
      issueDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      status: "ACTIVE",
      payload,
      signature,
    };

    this.state.credentials.push(credential);

    this.addAuditEvent(
      actorId,
      actorRole,
      actorName,
      "DIGITAL_CREDENTIAL_ISSUED",
      "STUDENT_CREDENTIAL",
      credential.id,
      "SUCCESS",
      { credentialNumber, algorithm: signature.algorithm, keyId: signature.keyId },
      student.institutionId
    );

    this.persist(this.state);
    return credential;
  }

  public revokeCredential(
    credentialId: string,
    reason: string,
    actorId: string,
    actorRole: Role,
    actorName: string
  ): StudentCredential | null {
    const cred = this.state.credentials.find((c) => c.id === credentialId);
    if (!cred) return null;

    cred.status = "REVOKED";
    cred.revocationReason = reason;
    cred.revokedAt = new Date().toISOString();
    cred.revokedBy = actorName;

    this.addAuditEvent(
      actorId,
      actorRole,
      actorName,
      "DIGITAL_CREDENTIAL_REVOKED",
      "STUDENT_CREDENTIAL",
      cred.id,
      "SUCCESS",
      { reason, revokedAt: cred.revokedAt },
      cred.issuingInstitutionId
    );

    this.persist(this.state);
    return cred;
  }

  public createConsentRequest(
    credentialId: string,
    requestingEmployer: string,
    purpose: string,
    requestedFields: string[]
  ): ConsentRequest | null {
    const cred = this.state.credentials.find((c) => c.id === credentialId);
    if (!cred) return null;

    const id = `CONSENT-REQ-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + 7);

    const request: ConsentRequest = {
      id,
      credentialId,
      studentId: cred.studentId,
      requestingEmployer,
      purpose,
      requestedFields,
      status: "PENDING",
      requestedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      otpChallenge: {
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        expiresAt: expiry.toISOString(),
        attemptsRemaining: 3,
      },
    };

    this.state.consentRequests.push(request);

    this.addAuditEvent(
      "EMPLOYER-VERIFIER-SYS",
      "EMPLOYER_VERIFIER",
      requestingEmployer,
      "CONSENT_REQUEST_INITIATED",
      "CONSENT_REQUEST",
      request.id,
      "SUCCESS",
      { credentialId, studentId: cred.studentId, requestedFields }
    );

    this.persist(this.state);
    return request;
  }

  public respondToConsent(
    requestId: string,
    approved: boolean,
    enteredOtp?: string
  ): { success: boolean; message: string; verificationToken?: string } {
    const req = this.state.consentRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: "Consent request not found" };

    if (!approved) {
      req.status = "DENIED";
      req.respondedAt = new Date().toISOString();
      this.addAuditEvent(
        "STUDENT-PORTAL",
        "STUDENT",
        "Student User",
        "CONSENT_REQUEST_DENIED",
        "CONSENT_REQUEST",
        req.id,
        "SUCCESS",
        { reason: "Student declined employer data access" }
      );
      this.persist(this.state);
      return { success: true, message: "Consent request declined successfully" };
    }

    // Verify OTP
    if (!req.otpChallenge || enteredOtp !== req.otpChallenge.code) {
      if (req.otpChallenge) {
        req.otpChallenge.attemptsRemaining = Math.max(0, req.otpChallenge.attemptsRemaining - 1);
      }
      return { success: false, message: "Invalid verification OTP code. Please re-enter the 6-digit simulated OTP." };
    }

    req.status = "APPROVED";
    req.respondedAt = new Date().toISOString();
    const token = `VTOKEN-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    req.verificationToken = token;
    const tokenExp = new Date();
    tokenExp.setMinutes(tokenExp.getMinutes() + 15); // 15-min single use token
    req.tokenExpiresAt = tokenExp.toISOString();

    this.addAuditEvent(
      "STUDENT-PORTAL",
      "STUDENT",
      "Student User",
      "CONSENT_REQUEST_APPROVED",
      "CONSENT_REQUEST",
      req.id,
      "SUCCESS",
      { verificationTokenIssued: true, validMinutes: 15 }
    );

    this.persist(this.state);
    return { success: true, message: "Consent approved successfully", verificationToken: token };
  }

  public addForensicDocument(
    doc: Omit<ForensicDocument, "id" | "uploadedAt" | "findings" | "reviewStatus">
  ): ForensicDocument {
    const id = `FORENSIC-DOC-${String(this.state.forensicDocuments.length + 1).padStart(2, "0")}`;
    const uploadedAt = new Date().toISOString();

    const findings = analyzeDocumentForensics(
      {
        fileName: doc.fileName,
        fileSizeBytes: doc.fileSizeBytes,
        fileSha256: doc.fileSha256,
        perceptualHash: doc.perceptualHash,
        extractedText: doc.extractedText,
        metadata: doc.metadata,
      },
      this.state.forensicDocuments
    );

    const hasCritical = findings.some((f) => f.severity === "CRITICAL" || f.severity === "HIGH");

    const record: ForensicDocument = {
      ...doc,
      id,
      uploadedAt,
      findings,
      reviewStatus: hasCritical ? "FLAGGED" : "VERIFIED_LEGITIMATE",
    };

    this.state.forensicDocuments.push(record);

    this.addAuditEvent(
      "AICTE-FORENSICS-SCANNER",
      "AICTE_ADMIN",
      "Digital Forensics Suite",
      "PDF_FORENSICS_SCANNED",
      "FORENSIC_DOCUMENT",
      record.id,
      "SUCCESS",
      {
        fileName: record.fileName,
        sha256Prefix: record.fileSha256.slice(0, 16),
        findingsCount: findings.length,
        hasCritical,
      },
      record.institutionId
    );

    this.persist(this.state);
    return record;
  }

  public addImportBatch(batch: ImportBatch): void {
    this.state.importBatches.unshift(batch);
    this.persist(this.state);
  }

  // Demo Tamper Simulation Controls
  public simulateAuditTamper(): { success: boolean; tamperedEventId: string } {
    if (this.state.auditEvents.length < 4) {
      return { success: false, tamperedEventId: "" };
    }

    // Tamper with event #4 (APAAR verification event) by altering its metadata without updating currentHash
    const target = this.state.auditEvents[3];
    this.state.tamperedEventBackup = JSON.parse(JSON.stringify(target));
    this.state.tamperSimulationActive = true;

    // Silently tamper payload
    target.actionType = "UNAUTHORIZED_RETROACTIVE_RECORD_ALTERATION";
    target.result = "SUCCESS";
    target.metadata = { tampered: true, originalOutcome: "ALTERED_BY_DEMO_TEST" };

    this.persist(this.state);
    return { success: true, tamperedEventId: target.id };
  }

  public restoreAuditTamper(): { success: boolean } {
    if (!this.state.tamperSimulationActive || !this.state.tamperedEventBackup) {
      return { success: false };
    }

    const idx = this.state.auditEvents.findIndex(
      (e) => e.id === this.state.tamperedEventBackup!.id
    );
    if (idx !== -1) {
      this.state.auditEvents[idx] = this.state.tamperedEventBackup;
    }
    this.state.tamperSimulationActive = false;
    this.state.tamperedEventBackup = undefined;

    this.persist(this.state);
    return { success: true };
  }
}

// Global singleton instance for Next.js API and SSR
export const store = new VidyaSetuStore();
