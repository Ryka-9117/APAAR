import { Student, DuplicateCase, ProgrammeMode, EnrolmentStatus } from "./types";

export interface DuplicateDetectionResult {
  hasConflict: boolean;
  conflictType: "CONCURRENT_FULL_TIME" | "HISTORICAL_SEQUENCE" | "PART_TIME_DUAL" | "DATA_DISCREPANCY";
  confidenceScore: number;
  ruleTriggered: string;
  isActionable: boolean;
  summary: string;
}

/**
 * Evaluates whether two enrolments for the same APAAR ID conflict under AICTE regulations
 */
export function evaluateEnrolmentConflict(
  recordA: {
    institutionId: string;
    courseId: string;
    academicYear: string;
    programmeMode: ProgrammeMode;
    enrolmentStatus: EnrolmentStatus;
  },
  recordB: {
    institutionId: string;
    courseId: string;
    academicYear: string;
    programmeMode: ProgrammeMode;
    enrolmentStatus: EnrolmentStatus;
  }
): DuplicateDetectionResult {
  // If records are from the same institution and course, this is not a cross-institution conflict
  if (recordA.institutionId === recordB.institutionId && recordA.courseId === recordB.courseId) {
    return {
      hasConflict: false,
      conflictType: "HISTORICAL_SEQUENCE",
      confidenceScore: 0,
      ruleTriggered: "Same institution record update",
      isActionable: false,
      summary: "Same institution and course enrolment.",
    };
  }

  const bothActive = recordA.enrolmentStatus === "ACTIVE" && recordB.enrolmentStatus === "ACTIVE";
  const sameAcademicYear = recordA.academicYear === recordB.academicYear;

  // Rule 1: Concurrent Full-Time Degree Violation (AICTE APH / UGC Dual Degree Guidelines)
  if (bothActive && recordA.programmeMode === "FULL_TIME" && recordB.programmeMode === "FULL_TIME") {
    return {
      hasConflict: true,
      conflictType: "CONCURRENT_FULL_TIME",
      confidenceScore: 98,
      ruleTriggered: "AICTE Norms Sec 4.3: Prohibition of Simultaneous Full-Time Regular Degrees in Separate Institutions",
      isActionable: true,
      summary: `Critical Conflict: Identical APAAR ID actively enrolled in two simultaneous Full-Time programmes in academic year ${recordA.academicYear} across distinct institutions.`,
    };
  }

  // Rule 2: Permissible Dual Programme (One Full-Time + One Part-Time / ODL under UGC 2022 Guidelines)
  if (
    bothActive &&
    ((recordA.programmeMode === "FULL_TIME" && recordB.programmeMode !== "FULL_TIME") ||
      (recordB.programmeMode === "FULL_TIME" && recordA.programmeMode !== "FULL_TIME") ||
      (recordA.programmeMode === "PART_TIME" && recordB.programmeMode === "PART_TIME"))
  ) {
    return {
      hasConflict: false,
      conflictType: "PART_TIME_DUAL",
      confidenceScore: 40,
      ruleTriggered: "UGC/AICTE Guidelines for Pursuing Two Academic Programmes Simultaneously (ODL/Part-Time Exception)",
      isActionable: false,
      summary: "Permissible Combination: Student is pursuing one regular programme and one part-time/online programme compliant with UGC guidelines.",
    };
  }

  // Rule 3: Legitimate Progression (One programme COMPLETED, followed by new admission)
  if (recordA.enrolmentStatus === "COMPLETED" || recordB.enrolmentStatus === "COMPLETED") {
    return {
      hasConflict: false,
      conflictType: "HISTORICAL_SEQUENCE",
      confidenceScore: 10,
      ruleTriggered: "Legitimate Academic Progression",
      isActionable: false,
      summary: "Historical Sequence: Student successfully completed prior degree before entering new admission.",
    };
  }

  // Rule 4: Data Discrepancy / Overlapping Active Records with ambiguous dates
  if (bothActive && !sameAcademicYear) {
    return {
      hasConflict: true,
      conflictType: "DATA_DISCREPANCY",
      confidenceScore: 75,
      ruleTriggered: "Unwithdrawn Active Record in Multi-Year Cycle",
      isActionable: true,
      summary: "Potential Inconsistent Data: Student remains marked as ACTIVE in a previous institution without formal transfer or withdrawal certificate.",
    };
  }

  return {
    hasConflict: false,
    conflictType: "HISTORICAL_SEQUENCE",
    confidenceScore: 15,
    ruleTriggered: "Inactive or Withdrawn Enrolment",
    isActionable: false,
    summary: "One or both programmes are withdrawn or inactive.",
  };
}

/**
 * Scans a list of students to find all cross-institution conflicts
 */
export function scanCrossInstitutionDuplicates(students: Student[]): DuplicateCase[] {
  const cases: DuplicateCase[] = [];
  const mapByApaar = new Map<string, Student[]>();

  for (const s of students) {
    if (!s.apaarNormalized) continue;
    const existing = mapByApaar.get(s.apaarNormalized) || [];
    existing.push(s);
    mapByApaar.set(s.apaarNormalized, existing);
  }

  let caseCounter = 1;
  for (const [apaar, records] of mapByApaar.entries()) {
    if (records.length < 2) continue;

    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const studentA = records[i];
        const studentB = records[j];

        if (studentA.institutionId === studentB.institutionId) continue;

        const evalResult = evaluateEnrolmentConflict(
          {
            institutionId: studentA.institutionId,
            courseId: studentA.courseId,
            academicYear: studentA.academicYear,
            programmeMode: studentA.programmeMode,
            enrolmentStatus: studentA.enrolmentStatus,
          },
          {
            institutionId: studentB.institutionId,
            courseId: studentB.courseId,
            academicYear: studentB.academicYear,
            programmeMode: studentB.programmeMode,
            enrolmentStatus: studentB.enrolmentStatus,
          }
        );

        cases.push({
          id: `DUP-CASE-${1000 + caseCounter++}`,
          apaarId: studentA.apaarId,
          apaarNormalized: apaar,
          studentName: studentA.fullName,
          institutionAId: studentA.institutionId,
          institutionBId: studentB.institutionId,
          courseAId: studentA.courseId,
          courseBId: studentB.courseId,
          programmeModeA: studentA.programmeMode,
          programmeModeB: studentB.programmeMode,
          academicYearA: studentA.academicYear,
          academicYearB: studentB.academicYear,
          admissionDateA: studentA.admissionDate,
          admissionDateB: studentB.admissionDate,
          statusA: studentA.enrolmentStatus,
          statusB: studentB.enrolmentStatus,
          conflictType: evalResult.conflictType,
          confidenceScore: evalResult.confidenceScore,
          ruleTriggered: evalResult.ruleTriggered,
          reviewStatus: evalResult.hasConflict ? "OPEN" : "RESOLVED_LEGITIMATE",
          investigationHistory: [
            {
              timestamp: new Date().toISOString(),
              actor: "AICTE_AUTOMATED_DETECTOR",
              action: "FLAGGED_INSPECTION",
              notes: evalResult.summary,
            },
          ],
        });
      }
    }
  }

  return cases;
}
