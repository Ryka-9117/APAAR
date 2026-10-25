import Papa from "papaparse";
import { ImportRowResult, Student, SeatCategory, ProgrammeMode } from "./types";
import { validateApaarFormat, normalizeApaarId } from "./apaar";

export const REQUIRED_CSV_COLUMNS = [
  "apaar_id",
  "institutional_student_id",
  "student_full_name",
  "dob",
  "institution_id",
  "course_id",
  "academic_year",
  "admission_date",
  "programme_mode",
  "seat_category",
];

export const VALID_SEAT_CATEGORIES: SeatCategory[] = [
  "SANCTIONED_OPEN",
  "TFW",
  "EWS",
  "PMSSS",
  "NRI_OCI_FN",
  "LATERAL_ENTRY",
  "KASHMIRI_MIGRANT",
  "PWD",
  "DEFENSE",
];

export const VALID_PROGRAMME_MODES: ProgrammeMode[] = [
  "FULL_TIME",
  "PART_TIME",
  "DISTANCE_ONLINE",
];

/**
 * Validates a batch of spreadsheet rows like a spreadsheet spell-checker
 */
export function validateBatchRows(
  rows: Record<string, string>[],
  validInstitutionIds: Set<string>,
  validCourseIds: Set<string>,
  existingApaarIds: Set<string>
): ImportRowResult[] {
  const results: ImportRowResult[] = [];
  const seenBatchApaar = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowNum = i + 1;
    const fieldErrors: ImportRowResult["fieldErrors"] = [];

    // 1. APAAR Validation
    const rawApaar = raw["apaar_id"] || raw["APAAR ID"] || raw["apaarId"] || "";
    if (!rawApaar.trim()) {
      fieldErrors.push({
        field: "apaar_id",
        message: "Missing mandatory APAAR ID",
        severity: "ERROR",
        suggestedFix: "Provide 12-digit student APAAR ID in format XXXX-XXXX-XXXX",
      });
    } else {
      const formatResult = validateApaarFormat(rawApaar);
      if (!formatResult.isValid) {
        fieldErrors.push({
          field: "apaar_id",
          message: formatResult.error || "Malformed APAAR ID format",
          severity: "ERROR",
          suggestedFix: "Ensure identifier contains exactly 12 numeric digits with valid check digit",
        });
      } else {
        const norm = formatResult.normalized;
        if (seenBatchApaar.has(norm)) {
          fieldErrors.push({
            field: "apaar_id",
            message: "Duplicate APAAR ID detected within the same spreadsheet upload",
            severity: "ERROR",
            suggestedFix: "Remove duplicate row or verify student identity",
          });
        } else {
          seenBatchApaar.add(norm);
        }

        if (existingApaarIds.has(norm)) {
          fieldErrors.push({
            field: "apaar_id",
            message: "Student APAAR ID is already registered in existing national database",
            severity: "WARNING",
            suggestedFix: "Importing will update existing student enrolment record",
          });
        }
      }
    }

    // 2. Student Name
    const name = raw["student_full_name"] || raw["Student Full Name"] || raw["fullName"] || "";
    if (!name.trim()) {
      fieldErrors.push({
        field: "student_full_name",
        message: "Missing student full name",
        severity: "ERROR",
        suggestedFix: "Enter student name matching 10th/12th certificate",
      });
    }

    // 3. Date of Birth
    const dob = raw["dob"] || raw["Date of Birth"] || raw["DOB"] || "";
    if (!dob.trim()) {
      fieldErrors.push({
        field: "dob",
        message: "Missing student date of birth",
        severity: "ERROR",
        suggestedFix: "Format as YYYY-MM-DD (e.g. 2003-05-14)",
      });
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      fieldErrors.push({
        field: "dob",
        message: `Invalid date format "${dob}". Required: YYYY-MM-DD`,
        severity: "ERROR",
        suggestedFix: "Convert date to standard ISO format (YYYY-MM-DD)",
      });
    } else {
      const year = parseInt(dob.split("-")[0], 10);
      if (year < 1980 || year > 2012) {
        fieldErrors.push({
          field: "dob",
          message: `Date of birth (${dob}) is outside typical undergraduate range`,
          severity: "WARNING",
          suggestedFix: "Verify student birth certificate for date accuracy",
        });
      }
    }

    // 4. Institution ID
    const instId = raw["institution_id"] || raw["Institution ID"] || raw["institutionId"] || "";
    if (!instId.trim()) {
      fieldErrors.push({
        field: "institution_id",
        message: "Missing Institution ID",
        severity: "ERROR",
        suggestedFix: "Specify valid approved institution code (e.g. DITS-DL-101)",
      });
    } else if (!validInstitutionIds.has(instId.trim())) {
      fieldErrors.push({
        field: "institution_id",
        message: `Unknown institution "${instId}". Institution is not registered or approved by AICTE`,
        severity: "ERROR",
        suggestedFix: "Select valid AICTE approved institution identifier",
      });
    }

    // 5. Course ID
    const courseId = raw["course_id"] || raw["Course ID"] || raw["courseId"] || "";
    if (!courseId.trim()) {
      fieldErrors.push({
        field: "course_id",
        message: "Missing Course ID",
        severity: "ERROR",
        suggestedFix: "Specify approved course code (e.g. BTECH-CSE)",
      });
    } else if (!validCourseIds.has(courseId.trim())) {
      fieldErrors.push({
        field: "course_id",
        message: `Unknown course "${courseId}" for the specified institution`,
        severity: "ERROR",
        suggestedFix: "Select an active approved course from AICTE Approval Process Handbook allotment",
      });
    }

    // 6. Programme Mode
    const mode = (raw["programme_mode"] || raw["Programme Mode"] || raw["programmeMode"] || "").toUpperCase();
    if (!mode) {
      fieldErrors.push({
        field: "programme_mode",
        message: "Missing programme mode",
        severity: "ERROR",
        suggestedFix: "Enter FULL_TIME, PART_TIME, or DISTANCE_ONLINE",
      });
    } else if (!VALID_PROGRAMME_MODES.includes(mode as ProgrammeMode)) {
      fieldErrors.push({
        field: "programme_mode",
        message: `Invalid programme mode "${mode}". Must be FULL_TIME, PART_TIME, or DISTANCE_ONLINE`,
        severity: "ERROR",
        suggestedFix: "Correct to FULL_TIME, PART_TIME, or DISTANCE_ONLINE",
      });
    }

    // 7. Seat Category
    const seatCat = (raw["seat_category"] || raw["Seat Category"] || raw["seatCategory"] || "").toUpperCase();
    if (!seatCat) {
      fieldErrors.push({
        field: "seat_category",
        message: "Missing seat category",
        severity: "ERROR",
        suggestedFix: "Specify seat category (SANCTIONED_OPEN, TFW, EWS, PMSSS, etc.)",
      });
    } else if (!VALID_SEAT_CATEGORIES.includes(seatCat as SeatCategory)) {
      fieldErrors.push({
        field: "seat_category",
        message: `Invalid seat category "${seatCat}" under AICTE APH classification`,
        severity: "ERROR",
        suggestedFix: "Select one of: SANCTIONED_OPEN, TFW, EWS, PMSSS, NRI_OCI_FN, LATERAL_ENTRY, PWD, DEFENSE",
      });
    }

    const hasErrors = fieldErrors.some((e) => e.severity === "ERROR");
    const hasWarnings = fieldErrors.some((e) => e.severity === "WARNING");

    results.push({
      rowNumber: rowNum,
      raw,
      status: hasErrors ? "ERROR" : hasWarnings ? "WARNING" : "VALID",
      fieldErrors,
      canImport: !hasErrors,
    });
  }

  return results;
}

/**
 * Generates sample CSV strings for download: Blank Template and Pre-populated Demo with deliberate errors
 */
export function getBlankTemplateCsv(): string {
  const headers = [
    "apaar_id",
    "institutional_student_id",
    "student_full_name",
    "dob",
    "gender",
    "category",
    "institution_id",
    "course_id",
    "academic_year",
    "admission_date",
    "programme_mode",
    "seat_category",
    "nri_status",
    "oci_status",
    "foreign_national",
  ];
  return headers.join(",") + "\n";
}

export function getDemoPopulatedCsv(): string {
  const rows = [
    // Header
    "apaar_id,institutional_student_id,student_full_name,dob,gender,category,institution_id,course_id,academic_year,admission_date,programme_mode,seat_category,nri_status,oci_status,foreign_national",
    // 1. Valid Row
    "9842-1234-5678,DITS-2024-CSE-101,Aarav Sharma,2003-05-14,MALE,GENERAL,INST-DITS,COURSE-DITS-CSE,2024-25,2024-07-15,FULL_TIME,SANCTIONED_OPEN,false,false,false",
    // 2. Valid Row (TFW)
    "7621-4589-2314,VEA-2024-ECE-045,Priya Nair,2002-11-20,FEMALE,OBC,INST-VEA,COURSE-VEA-ECE,2024-25,2024-07-20,FULL_TIME,TFW,false,false,false",
    // 3. Error Row: Malformed APAAR ID (checksum invalid / 11 digits)
    "9999-8888-777,MITR-2024-MECH-012,Sameer Deshmukh,2003-04-12,MALE,GENERAL,INST-MITR,COURSE-MITR-MECH,2024-25,2024-08-01,FULL_TIME,SANCTIONED_OPEN,false,false,false",
    // 4. Error Row: Missing Student Name
    "6532-9814-7253,KNIE-2024-CSE-088,,2003-08-09,MALE,SC,INST-KNIE,COURSE-KNIE-CSE,2024-25,2024-07-18,FULL_TIME,SANCTIONED_OPEN,false,false,false",
    // 5. Error Row: Unknown Course ID
    "8912-3476-5123,GTC-2024-AI-019,Ananya Iyer,2004-01-30,FEMALE,GENERAL,INST-GTC,COURSE-INVALID-AI,2024-25,2024-07-25,FULL_TIME,SANCTIONED_OPEN,false,false,false",
    // 6. Warning Row: Student already in database / future DOB check
    "5432-1678-9012,RIPE-2024-EE-034,Vikramaditya Rathore,2002-07-18,MALE,GENERAL,INST-RIPE,COURSE-RIPE-EE,2024-25,2024-07-10,FULL_TIME,LATERAL_ENTRY,false,false,false",
    // 7. Error Row: Invalid Seat Category
    "9012-3456-7812,UPIST-2024-IT-099,Devendra Patel,2003-03-25,MALE,OBC,INST-UPIST,COURSE-UPIST-IT,2024-25,2024-07-22,FULL_TIME,UNOFFICIAL_MANAGEMENT_QUOTA,false,false,false",
  ];
  return rows.join("\n");
}
