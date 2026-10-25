export type Role =
  | "AICTE_ADMIN"
  | "INSTITUTION_ADMIN"
  | "AUTHORIZED_VERIFIER"
  | "EMPLOYER_VERIFIER"
  | "STUDENT";

export type ProgrammeMode = "FULL_TIME" | "PART_TIME" | "DISTANCE_ONLINE";

export type SeatCategory =
  | "SANCTIONED_OPEN"
  | "TFW" // Tuition Fee Waiver (5% supernumerary)
  | "EWS" // Economically Weaker Section (10% supernumerary)
  | "PMSSS" // Prime Minister's Special Scholarship Scheme (J&K/Ladakh)
  | "NRI_OCI_FN" // NRI / OCI / Foreign Nationals (up to 15% supernumerary)
  | "LATERAL_ENTRY" // Direct 2nd Year Diploma to Degree (10% + vacant)
  | "KASHMIRI_MIGRANT"
  | "PWD" // 5% reservation within intake
  | "DEFENSE";

export type EnrolmentStatus = "ACTIVE" | "COMPLETED" | "WITHDRAWN" | "SUSPENDED";

export type ApaarVerificationOutcome =
  | "FORMAT_VALID"
  | "REGISTRY_MATCH"
  | "IDENTITY_NOT_FOUND"
  | "NAME_MISMATCH"
  | "DOB_MISMATCH"
  | "VERIFICATION_UNAVAILABLE";

export type CanonicalVerificationStatus =
  | "VERIFIED"
  | "MISMATCH"
  | "NOT_FOUND"
  | "PENDING"
  | "EXPIRED"
  | "UNAVAILABLE";

export type VerificationCategory =
  | "APAAR_REGISTRY"
  | "INSTITUTIONAL_STUDENT"
  | "COURSE_INTAKE"
  | "ADMISSION_RECORD"
  | "DIGITAL_CREDENTIAL"
  | "ISSUING_SOURCE";

export type CredentialStatus = "ACTIVE" | "REVOKED" | "EXPIRED" | "SUSPENDED";

export type DuplicateReviewStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "CLARIFICATION_REQUESTED"
  | "RESOLVED_DUPLICATE"
  | "RESOLVED_LEGITIMATE";

export interface Institution {
  id: string;
  code: string; // e.g. "AICTE-DL-101"
  name: string;
  state: string;
  city: string;
  type: "GOVERNMENT" | "GOVT_AIDED" | "PRIVATE_AUTONOMOUS" | "AFFILIATED";
  establishedYear: number;
  accreditation: "NAAC_A_PLUS" | "NAAC_A" | "NBA_ACCREDITED" | "PROVISIONAL";
  approvedIntakeTotal: number;
  contactEmail: string;
  contactPhone: string;
  riskScore: number; // 0-100 demonstration score
  riskFactors: {
    factor: string;
    weight: number;
    description: string;
  }[];
}

export interface Course {
  id: string;
  institutionId: string;
  code: string; // e.g. "BTECH-CSE"
  name: string; // e.g. "B.Tech Computer Science & Engineering"
  degreeLevel: "UNDERGRADUATE" | "POSTGRADUATE" | "DIPLOMA";
  academicYear: string; // e.g. "2024-25"
  approvedCapacity: number; // Sanctioned Intake
  activeEnrolment: number; // Current Active
  supernumeraryLimits: {
    tfw: number; // 5%
    ews: number; // 10%
    nriOciFn: number; // 15%
    pmsss: number; // Max allowed
    lateralEntry: number; // 10%
  };
  supernumeraryEnrolled: {
    tfw: number;
    ews: number;
    nriOciFn: number;
    pmsss: number;
    lateralEntry: number;
  };
  utilizationPct: number;
  status: "NORMAL" | "WARNING" | "CAPACITY_REACHED" | "OVER_INTAKE";
  lastAuditTimestamp: string;
}

export interface Student {
  id: string;
  apaarId: string; // 12-digit format e.g. "9842-1234-5678"
  apaarNormalized: string; // "984212345678"
  institutionalStudentId: string; // e.g. "DITS-2024-CSE-042"
  fullName: string;
  dob: string; // YYYY-MM-DD
  gender: "MALE" | "FEMALE" | "OTHER";
  category: "GENERAL" | "OBC" | "SC" | "ST" | "EWS";
  seatCategory: SeatCategory;
  nriStatus: boolean;
  ociStatus: boolean;
  foreignNational: boolean;
  institutionId: string;
  courseId: string;
  academicYear: string;
  admissionDate: string;
  programmeMode: ProgrammeMode;
  enrolmentStatus: EnrolmentStatus;
  apaarStatus: ApaarVerificationOutcome;
  apaarVerifiedAt?: string;
  supportingDocHash?: string;
  supportingDocName?: string;
  lastUpdated: string;
}

export interface DuplicateCase {
  id: string;
  apaarId: string;
  apaarNormalized: string;
  studentName: string;
  institutionAId: string;
  institutionBId: string;
  courseAId: string;
  courseBId: string;
  programmeModeA: ProgrammeMode;
  programmeModeB: ProgrammeMode;
  academicYearA: string;
  academicYearB: string;
  admissionDateA: string;
  admissionDateB: string;
  statusA: EnrolmentStatus;
  statusB: EnrolmentStatus;
  conflictType: "CONCURRENT_FULL_TIME" | "HISTORICAL_SEQUENCE" | "PART_TIME_DUAL" | "DATA_DISCREPANCY";
  confidenceScore: number; // 0-100%
  ruleTriggered: string;
  reviewStatus: DuplicateReviewStatus;
  assignedReviewer?: string;
  resolutionReason?: string;
  investigationHistory: {
    timestamp: string;
    actor: string;
    action: string;
    notes: string;
  }[];
}

export interface StudentCredential {
  id: string;
  studentId: string;
  credentialNumber: string; // e.g. "VS-CRED-2024-9842"
  issuingInstitutionId: string;
  courseId: string;
  academicYear: string;
  issueDate: string;
  expiryDate: string;
  status: CredentialStatus;
  revocationReason?: string;
  revokedAt?: string;
  revokedBy?: string;
  payload: {
    studentId: string;
    studentName: string;
    maskedApaar: string;
    institutionalStudentId: string;
    institutionName: string;
    courseName: string;
    academicYear: string;
    cgpa?: number;
    completionStatus: string;
  };
  signature: {
    algorithm: "HMAC-SHA256";
    keyId: string;
    signatureHex: string;
    timestamp: string;
  };
}

export interface ConsentRequest {
  id: string;
  credentialId: string;
  studentId: string;
  requestingEmployer: string;
  purpose: string;
  requestedFields: string[]; // e.g. ["courseName", "academicYear", "completionStatus"]
  status: "PENDING" | "APPROVED" | "DENIED" | "EXPIRED";
  requestedAt: string;
  expiresAt: string;
  otpChallenge?: {
    code: string; // 6-digit OTP
    expiresAt: string;
    attemptsRemaining: number;
  };
  verificationToken?: string;
  tokenExpiresAt?: string;
  respondedAt?: string;
}

export interface AuditEvent {
  id: string;
  eventNumber: number;
  timestamp: string;
  actorId: string;
  actorRole: Role;
  actorName: string;
  institutionId?: string;
  actionType: string;
  targetEntity: string;
  targetReference: string;
  result: "SUCCESS" | "FAILURE" | "DENIED";
  metadata: Record<string, unknown>;
  previousHash: string;
  currentHash: string;
}

export interface ForensicDocument {
  id: string;
  studentId?: string;
  studentName?: string;
  institutionId: string;
  fileName: string;
  fileSizeBytes: number;
  fileSha256: string;
  perceptualHash: string; // Block hash for visual similarity
  pageCount: number;
  uploadedAt: string;
  extractedText: string;
  metadata: {
    creator?: string;
    producer?: string;
    creationDate?: string;
    modifiedDate?: string;
    title?: string;
  };
  findings: {
    type: "EXACT_DUPLICATE" | "PERCEPTUAL_SIMILARITY" | "TEXT_TAMPER_SUSPECTED" | "METADATA_ANOMALY" | "CLEAN";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    matchedDocId?: string;
    matchedFileName?: string;
    similarityScore?: number; // 0-100%
    explanation: string;
  }[];
  reviewStatus: "FLAGGED" | "UNDER_REVIEW" | "VERIFIED_LEGITIMATE" | "CONFIRMED_ANOMALY";
  reviewerNotes?: string;
}

export interface ImportRowResult {
  rowNumber: number;
  raw: Record<string, string>;
  status: "VALID" | "WARNING" | "ERROR";
  fieldErrors: {
    field: string;
    message: string;
    severity: "ERROR" | "WARNING";
    suggestedFix?: string;
  }[];
  canImport: boolean;
}

export interface ImportBatch {
  id: string;
  institutionId: string;
  fileName: string;
  uploadedAt: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  status: "PREVIEWING" | "COMMITTED" | "DISCARDED";
  importedCount: number;
  rowResults: ImportRowResult[];
}
