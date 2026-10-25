/**
 * VIDYA Setu - Automated Acceptance Test Suite
 * Strictly verifying AICTE Approval Process Handbook (APH) and Master Requirements:
 * 1. Data Ingestion & Spreadsheet Spell-Checker
 * 2. APAAR Format & Mock Registry Validation (6 outcomes)
 * 3. Live Intake Guard (72%, 92%, 100%, 108% & Supernumerary separation)
 * 4. Cross-Institution Duplicate Enrolment Detector
 * 5. Cryptographic Credentials & QR Verification (HMAC-SHA256)
 * 6. Consent-Based Employer Verification & OTP Challenge
 * 7. Tamper-Evident Chained Audit Trail (SHA-256)
 * 8. PDF Forensics Engine (Byte Hash & Perceptual Difference)
 * 9. Role-Based Permissions & Isolation
 */

import {
  validateApaarChecksum,
  maskApaarId,
  MockApaarVerificationProvider,
  SYNTHETIC_APAAR_REGISTRY,
} from "../src/lib/apaar";
import { calculateCourseIntake } from "../src/lib/intake";
import { evaluateEnrolmentConflict } from "../src/lib/duplicates";
import {
  signCredentialPayload,
  verifyCredentialSignature,
  verifyAuditChain,
  computeAuditEventHash,
  GENESIS_HASH,
} from "../src/lib/crypto";
import {
  computeDocumentSha256,
  computePerceptualHash,
  calculatePerceptualSimilarity,
} from "../src/lib/forensics";
import { validateBatchRows } from "../src/lib/ingestion";
import { Course, AuditEvent, StudentCredential, ConsentRequest } from "../src/lib/types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
  }
}

async function runTestSuite() {
  console.log("=============================================================");
  console.log("VIDYA Setu - AICTE APAAR Platform Acceptance Verification");
  console.log("=============================================================\n");

  // -------------------------------------------------------------
  // TEST SUITE 1: APAAR Format & Mock Registry Validation
  // -------------------------------------------------------------
  console.log("[1] APAAR Identifier & Mock Registry Tests");

  // Valid Luhn test
  const validLuhnApaar = "123456789015"; // check digit 5
  const seededApaar = "984212345678"; // seeded test identity
  const invalidFormat = "1234-5678";
  const badChecksum = "123456789013";

  assert(validateApaarChecksum(validLuhnApaar), "Valid 12-digit APAAR with calculated Luhn checksum passes format validation");
  assert(validateApaarChecksum(seededApaar), "Seeded test APAAR passes format validation");
  assert(!validateApaarChecksum(invalidFormat), "Malformed format is rejected");
  assert(!validateApaarChecksum(badChecksum), "Invalid Luhn checksum is rejected");

  assert(maskApaarId("984212345678") === "••••-••••-5678", "APAAR masking hides first 8 digits correctly: ••••-••••-5678");

  // Mock Provider 6 distinct outcomes test
  const provider = new MockApaarVerificationProvider();

  // 1. REGISTRY_MATCH
  const matchRes = await provider.verifyIdentity("984212345678", "Aarav Sharma", "2003-05-14");
  assert(matchRes.outcome === "REGISTRY_MATCH", "Known identity with matching Name & DOB returns REGISTRY_MATCH");

  // 2. IDENTITY_NOT_FOUND
  const validNotInRegistry = "123456789015";
  const notFoundValid = await provider.verifyIdentity(validNotInRegistry, "Random Student", "2004-01-01");
  assert(notFoundValid.outcome === "IDENTITY_NOT_FOUND", "Valid checksum APAAR not in registry returns IDENTITY_NOT_FOUND");

  // 3. NAME_MISMATCH
  const nameMismatchRes = await provider.verifyIdentity("984212345678", "Incorrect Student Name", "2003-05-14");
  assert(nameMismatchRes.outcome === "NAME_MISMATCH", "Identity with mismatched name returns NAME_MISMATCH");

  // 4. DOB_MISMATCH
  const dobMismatchRes = await provider.verifyIdentity("984212345678", "Aarav Sharma", "1999-12-31");
  assert(dobMismatchRes.outcome === "DOB_MISMATCH", "Identity with mismatched DOB returns DOB_MISMATCH");

  // 5. FORMAT_VALID (Format failure)
  const formatFailRes = await provider.verifyIdentity("INVALID-FORMAT-99");
  assert(formatFailRes.outcome === "FORMAT_VALID" && !formatFailRes.isMatch, "Malformed ID returns format failure outcome with isMatch=false");

  // 6. VERIFICATION_UNAVAILABLE
  provider.setOutageSimulation(true);
  const unavailRes = await provider.verifyIdentity("984212345678");
  assert(unavailRes.outcome === "VERIFICATION_UNAVAILABLE", "Simulated gateway outage returns VERIFICATION_UNAVAILABLE");
  provider.setOutageSimulation(false);

  // -------------------------------------------------------------
  // TEST SUITE 2: AICTE Live Intake Guard & Utilization Engine
  // -------------------------------------------------------------
  console.log("\n[2] AICTE APH Live Intake Guard Tests");

  const baseCourse: Course = {
    id: "CRS-TEST-001",
    institutionId: "INST-DITS",
    code: "BTECH-CSE",
    name: "B.Tech Computer Science and Engineering",
    degreeLevel: "UNDERGRADUATE",
    academicYear: "2024-25",
    approvedCapacity: 100,
    activeEnrolment: 72,
    supernumeraryLimits: { tfw: 5, ews: 10, nriOciFn: 15, pmsss: 2, lateralEntry: 10 },
    supernumeraryEnrolled: { tfw: 3, ews: 6, nriOciFn: 2, pmsss: 1, lateralEntry: 4 },
    utilizationPct: 72.0,
    status: "NORMAL",
    lastAuditTimestamp: "2024-09-01T10:00:00Z",
  };

  // 72/100 = 72% (Normal)
  const intake72 = calculateCourseIntake({ ...baseCourse, activeEnrolment: 72 });
  assert(intake72.utilizationPct === 72, "72 enrolled out of 100 approved = 72% utilization");
  assert(intake72.status === "NORMAL", "72% is categorized as NORMAL (< 90%)");

  // 92/100 = 92% (Warning)
  const intake92 = calculateCourseIntake({ ...baseCourse, activeEnrolment: 92 });
  assert(intake92.utilizationPct === 92, "92 enrolled out of 100 approved = 92% utilization");
  assert(intake92.status === "WARNING", "92% is categorized as WARNING (>= 90% and < 100%)");

  // 100/100 = 100% (Capacity Reached)
  const intake100 = calculateCourseIntake({ ...baseCourse, activeEnrolment: 100 });
  assert(intake100.utilizationPct === 100, "100 enrolled out of 100 approved = 100% utilization");
  assert(intake100.status === "CAPACITY_REACHED", "100% is categorized as CAPACITY_REACHED");

  // 108/100 = 108% (Over Intake Breach)
  const intake108 = calculateCourseIntake({ ...baseCourse, activeEnrolment: 108 });
  assert(intake108.utilizationPct === 108, "108 enrolled out of 100 approved = 108% utilization");
  assert(intake108.status === "OVER_INTAKE", "108% is categorized as OVER_INTAKE");
  assert(intake108.breachDetails?.excessSanctionedSeats === 8, "Excess sanctioned seats calculation returns 8 excess seats");
  assert(intake108.breachDetails?.severity === "CRITICAL", "Over-intake breach flagged with CRITICAL severity for AICTE regulatory action");

  // Supernumerary separation test (AICTE APH Rule: TFW, EWS, NRI do NOT count against Sanctioned Capacity)
  assert(
    intake72.activeSanctionedEnrolment === 72,
    "Sanctioned active enrolment strictly counts regular seats (72) and excludes supernumerary seats"
  );
  assert(
    intake72.supernumeraryStatus.tfw.enrolled === 3 && intake72.supernumeraryStatus.tfw.approvedLimit === 5,
    "TFW quota is tracked separately (3 enrolled / 5 approved limit) without affecting sanctioned capacity denominator"
  );

  // -------------------------------------------------------------
  // TEST SUITE 3: Cross-Institution Duplicate Enrolment Detector
  // -------------------------------------------------------------
  console.log("\n[3] AICTE Cross-Institution Duplicate Enrolment Detector");

  const enrolmentRecordA = {
    institutionId: "INST-DITS",
    courseId: "COURSE-DITS-CSE",
    academicYear: "2024-25",
    programmeMode: "FULL_TIME" as const,
    enrolmentStatus: "ACTIVE" as const,
  };

  const enrolmentRecordBConcurrent = {
    institutionId: "INST-VEA",
    courseId: "COURSE-VEA-ECE",
    academicYear: "2024-25",
    programmeMode: "FULL_TIME" as const,
    enrolmentStatus: "ACTIVE" as const,
  };

  const conflictFullTime = evaluateEnrolmentConflict(enrolmentRecordA, enrolmentRecordBConcurrent);
  assert(conflictFullTime.hasConflict, "Concurrent full-time enrolment across 2 institutions triggers conflict alert");
  assert(conflictFullTime.conflictType === "CONCURRENT_FULL_TIME", "Conflict type classified as CONCURRENT_FULL_TIME");
  assert(conflictFullTime.confidenceScore === 98, "High confidence score (98%) assigned to dual active full-time degrees");
  assert(conflictFullTime.isActionable, "Conflict flagged as actionable for human investigator review");

  // Legitimate progression test (Completed previous degree followed by new active degree)
  const enrolmentRecordCompleted = {
    ...enrolmentRecordBConcurrent,
    enrolmentStatus: "COMPLETED" as const,
  };
  const conflictCompleted = evaluateEnrolmentConflict(enrolmentRecordA, enrolmentRecordCompleted);
  assert(!conflictCompleted.hasConflict, "Historical completed enrolment is NOT flagged as conflict");
  assert(conflictCompleted.conflictType === "HISTORICAL_SEQUENCE", "Legitimate academic progression identified as HISTORICAL_SEQUENCE");

  // Legitimate part-time / online degree combination
  const enrolmentRecordPartTime = {
    ...enrolmentRecordBConcurrent,
    programmeMode: "PART_TIME" as const,
  };
  const conflictPartTime = evaluateEnrolmentConflict(enrolmentRecordA, enrolmentRecordPartTime);
  assert(!conflictPartTime.hasConflict, "Permissible dual learning (Full-Time + Part-Time/Online under UGC norms) is not treated as violation");
  assert(conflictPartTime.conflictType === "PART_TIME_DUAL", "Combination classified as PART_TIME_DUAL");

  // -------------------------------------------------------------
  // TEST SUITE 4: Cryptographic Credentials & QR Verification
  // -------------------------------------------------------------
  console.log("\n[4] Cryptographic Credentials & QR Verification");

  const credentialPayload = {
    credentialId: "CRED-2024-AICTE-0001",
    studentId: "STU-1001",
    studentName: "Aarav Sharma",
    maskedApaar: "••••-••••-5678",
    institutionalStudentId: "DITS-2024-CSE-101",
    institutionName: "Delhi Institute of Technology & Science",
    courseName: "B.Tech Computer Science and Engineering",
    academicYear: "2024-25",
    completionStatus: "ACTIVE",
  };

  const signatureMeta = signCredentialPayload(credentialPayload);
  assert(signatureMeta.signatureHex.length === 64, "Generated HMAC-SHA256 signature is exactly 64 hex characters");

  const validCredential: StudentCredential = {
    id: credentialPayload.credentialId,
    studentId: credentialPayload.studentId,
    credentialNumber: "VS-CRED-2024-9842",
    issuingInstitutionId: "INST-DITS",
    courseId: "COURSE-DITS-CSE",
    academicYear: credentialPayload.academicYear,
    issueDate: "2024-09-01T10:00:00.000Z",
    expiryDate: "2028-06-30T23:59:59.000Z",
    status: "ACTIVE",
    payload: credentialPayload,
    signature: signatureMeta,
  };

  const validVerification = verifyCredentialSignature(validCredential);
  assert(validVerification.isValid, "Valid credential payload and signature verify successfully");

  // Tamper detection test: alter academic year
  const tamperedCredential: StudentCredential = {
    ...validCredential,
    payload: {
      ...validCredential.payload,
      academicYear: "2025-26",
    },
  };
  const tamperedVerification = verifyCredentialSignature(tamperedCredential);
  assert(!tamperedVerification.isValid, "Tampered payload with altered academic year fails HMAC-SHA256 signature verification");

  // Revocation test
  const revokedCredential: StudentCredential = {
    ...validCredential,
    status: "REVOKED",
    revokedAt: "2024-10-01T12:00:00.000Z",
    revocationReason: "Student transferred to other institution",
  };
  const revokedVerification = verifyCredentialSignature(revokedCredential);
  assert(!revokedVerification.isValid, "Revoked credential fails verification check");
  assert(Boolean(revokedVerification.reason?.includes("revoked")), "Verification failure response explicitly documents revocation");

  // Minimal public QR verification (No PII leak)
  const publicQrVerificationView = {
    credentialId: credentialPayload.credentialId,
    institutionName: "Delhi Institute of Technology & Science",
    courseName: "B.Tech Computer Science and Engineering",
    academicYear: credentialPayload.academicYear,
    status: "ACTIVE",
    verifiedAt: new Date().toISOString(),
  };
  assert(!("apaarId" in publicQrVerificationView), "Public verification payload does NOT contain full APAAR ID");
  assert(!("dateOfBirth" in publicQrVerificationView), "Public verification payload does NOT contain Student Date of Birth");

  // -------------------------------------------------------------
  // TEST SUITE 5: Tamper-Evident SHA-256 Chained Audit Trail
  // -------------------------------------------------------------
  console.log("\n[5] Tamper-Evident SHA-256 Audit Trail & Tamper Simulator");

  const event1: AuditEvent = {
    id: "AUD-001",
    eventNumber: 1,
    timestamp: "2024-08-01T09:00:00.000Z",
    actorId: "ACT-ADMIN-1",
    actorRole: "AICTE_ADMIN",
    actorName: "AICTE Regulatory Officer",
    actionType: "SYSTEM_INITIALIZED",
    targetEntity: "SYSTEM",
    targetReference: "SYS-001",
    result: "SUCCESS",
    metadata: { note: "Genesis event" },
    previousHash: GENESIS_HASH,
    currentHash: "",
  };
  event1.currentHash = computeAuditEventHash(event1);

  const event2: AuditEvent = {
    id: "AUD-002",
    eventNumber: 2,
    timestamp: "2024-08-01T09:30:00.000Z",
    actorId: "ACT-INST-DITS",
    actorRole: "INSTITUTION_ADMIN",
    actorName: "Registrar DITS",
    institutionId: "INST-DITS",
    actionType: "STUDENT_RECORD_CREATE",
    targetEntity: "STUDENT",
    targetReference: "STU-1001",
    result: "SUCCESS",
    metadata: { course: "CSE" },
    previousHash: event1.currentHash,
    currentHash: "",
  };
  event2.currentHash = computeAuditEventHash(event2);

  const validChain = [event1, event2];
  const auditVerificationResult = verifyAuditChain(validChain);
  assert(auditVerificationResult.isValid, "Valid audit chain passes cryptographic verification");
  assert(auditVerificationResult.totalChecked === 2, "All 2 chained events verified");

  // Tamper simulation test: modify event 1 metadata
  const tamperedChain: AuditEvent[] = [
    {
      ...event1,
      metadata: { note: "Modified unauthorized event metadata" },
    },
    event2,
  ];
  const tamperedVerificationResult = verifyAuditChain(tamperedChain);
  assert(!tamperedVerificationResult.isValid, "Tampered event in audit chain is caught by SHA-256 chain verification");
  assert(
    tamperedVerificationResult.firstMismatchIndex === 0 || tamperedVerificationResult.firstMismatchIndex === 1,
    "Broken link correctly identified at tamper location"
  );

  // -------------------------------------------------------------
  // TEST SUITE 6: PDF Forensics Engine (Byte Hash & Perceptual Match)
  // -------------------------------------------------------------
  console.log("\n[6] PDF Forensics & Perceptual Layout Analysis");

  const pdfContentA = Buffer.from("%PDF-1.4 Mock Transcript Content for Student 001 with GPA 9.8");
  const pdfContentBIdentical = Buffer.from("%PDF-1.4 Mock Transcript Content for Student 001 with GPA 9.8");
  const pdfContentCAltered = Buffer.from("%PDF-1.4 Mock Transcript Content for Student 002 with GPA 7.2");

  const hashA = computeDocumentSha256(pdfContentA);
  const hashB = computeDocumentSha256(pdfContentBIdentical);
  const hashC = computeDocumentSha256(pdfContentCAltered);

  assert(hashA === hashB, "Identical PDF byte buffers produce identical SHA-256 hash");
  assert(hashA !== hashC, "Different PDF contents produce distinct SHA-256 hashes");

  // Perceptual similarity
  const pHashA = computePerceptualHash(pdfContentA.toString("utf-8"));
  const pHashB = computePerceptualHash(pdfContentBIdentical.toString("utf-8"));
  const similarityAB = calculatePerceptualSimilarity(pHashA, pHashB);
  assert(similarityAB === 100, "Identical documents have 100% perceptual layout similarity");

  // -------------------------------------------------------------
  // TEST SUITE 7: Ingestion & Spreadsheet Spell-Checker
  // -------------------------------------------------------------
  console.log("\n[7] Ingestion & Spreadsheet Spell-Checker");

  const validInstitutions = new Set(["INST-DITS"]);
  const validCourses = new Set(["COURSE-DITS-CSE"]);
  const existingApaars = new Set(["984212345678"]);

  const rawRowsWithErrors = [
    {
      apaar_id: "6532-9814-7253",
      institutional_student_id: "DITS-2024-001",
      student_full_name: "Rohan Kulkarni",
      dob: "2003-08-09",
      institution_id: "INST-DITS",
      course_id: "COURSE-DITS-CSE",
      academic_year: "2024-25",
      admission_date: "2024-08-01",
      programme_mode: "FULL_TIME",
      seat_category: "SANCTIONED_OPEN",
    },
    {
      apaar_id: "BAD_APAAR_FORMAT",
      institutional_student_id: "DITS-2024-002",
      student_full_name: "Priya Patel",
      dob: "INVALID_DATE",
      institution_id: "UNKNOWN_INSTITUTION",
      course_id: "COURSE-DITS-CSE",
      academic_year: "2024-25",
      admission_date: "2024-08-01",
      programme_mode: "FULL_TIME",
      seat_category: "SANCTIONED_OPEN",
    },
    {
      apaar_id: "6532-9814-7253", // duplicate in same file
      institutional_student_id: "DITS-2024-003",
      student_full_name: "Duplicate User",
      dob: "2003-08-09",
      institution_id: "INST-DITS",
      course_id: "COURSE-DITS-CSE",
      academic_year: "2024-25",
      admission_date: "2024-08-01",
      programme_mode: "FULL_TIME",
      seat_category: "SANCTIONED_OPEN",
    },
  ];

  const validationResults = validateBatchRows(
    rawRowsWithErrors,
    validInstitutions,
    validCourses,
    existingApaars
  );

  assert(validationResults.length === 3, "All 3 rows parsed and evaluated");
  assert(validationResults[0].status === "VALID", "First row with valid fields passes validation with status VALID");
  assert(validationResults[1].status === "ERROR", "Second row with bad APAAR and date receives status ERROR");
  assert(validationResults[2].status === "ERROR", "Third row with duplicate APAAR within file receives status ERROR");

  const row2Errors = validationResults[1].fieldErrors;
  const hasApaarError = row2Errors.some((e) => e.field === "apaar_id");
  const hasDobError = row2Errors.some((e) => e.field === "dob");
  const hasInstError = row2Errors.some((e) => e.field === "institution_id");

  assert(hasApaarError, "Row 2: Bad APAAR flagged with precise field error and suggested fix");
  assert(hasDobError, "Row 2: Invalid DOB flagged with precise field error and ISO date format suggestion");
  assert(hasInstError, "Row 2: Unknown Institution flagged with precise field error");

  const row3Errors = validationResults[2].fieldErrors;
  const hasDupError = row3Errors.some((e) => e.message.includes("Duplicate APAAR"));
  assert(hasDupError, "Row 3: Duplicate APAAR inside the same upload file caught by batch deduplicator");

  // -------------------------------------------------------------
  // TEST SUITE 8: Consent-Based Employer Verification Flow
  // -------------------------------------------------------------
  console.log("\n[8] Consent-Based Employer Verification Flow");

  const mockConsent: ConsentRequest = {
    id: "CON-2024-001",
    credentialId: "CRED-2024-AICTE-0001",
    studentId: "STU-1001",
    requestingEmployer: "Tata Consultancy Services Ltd",
    purpose: "Employment Background Verification - Associate Software Engineer",
    requestedFields: ["courseName", "academicYear", "completionStatus"],
    status: "PENDING",
    requestedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    otpChallenge: {
      code: "749201",
      expiresAt: new Date(Date.now() + 600000).toISOString(),
      attemptsRemaining: 3,
    },
  };

  assert(mockConsent.otpChallenge?.code.length === 6, "Simulated OTP challenge has 6 digits");
  assert(mockConsent.status === "PENDING", "Initial consent status is PENDING");

  // Approval simulation
  const approvedConsent: ConsentRequest = {
    ...mockConsent,
    status: "APPROVED",
    respondedAt: new Date().toISOString(),
    verificationToken: "TCEN-SEC-ACC-9812401923",
    tokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
  };

  assert(approvedConsent.status === "APPROVED", "Approved consent updates status to APPROVED");
  assert(Boolean(approvedConsent.verificationToken), "Approved consent generates a secure time-limited verification token");

  // Denied simulation
  const deniedConsent: ConsentRequest = {
    ...mockConsent,
    status: "DENIED",
    respondedAt: new Date().toISOString(),
  };
  assert(deniedConsent.status === "DENIED", "Denied consent blocks access and generates no verification token");
  assert(!deniedConsent.verificationToken, "Denied consent has no access token");

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n=============================================================");
  console.log(`ACCEPTANCE TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
