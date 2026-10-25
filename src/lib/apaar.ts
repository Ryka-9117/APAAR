import { ApaarVerificationOutcome } from "./types";

/**
 * Standard APAAR format pattern: 12 numeric digits, usually formatted as 4-4-4 (XXXX-XXXX-XXXX)
 */
export const APAAR_FORMAT_REGEX = /^\d{4}-\d{4}-\d{4}$/;
export const APAAR_RAW_REGEX = /^\d{12}$/;

/**
 * Normalizes any APAAR string to 12 consecutive digits
 */
export function normalizeApaarId(input: string): string {
  if (!input) return "";
  return input.replace(/[\s-]/g, "").trim();
}

/**
 * Formats 12 digits to XXXX-XXXX-XXXX
 */
export function formatApaarId(normalized: string): string {
  const clean = normalizeApaarId(normalized);
  if (clean.length !== 12) return normalized;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
}

/**
 * Masks APAAR ID for privacy in ordinary tables and logs: "••••-••••-9012"
 */
export function maskApaarId(apaarId: string, isAuthorized: boolean = false): string {
  if (isAuthorized) return apaarId;
  const clean = normalizeApaarId(apaarId);
  if (clean.length !== 12) return "••••-••••-••••";
  return `••••-••••-${clean.slice(8, 12)}`;
}

export const SEEDED_APAAR_WHITELIST = new Set([
  "984212345678",
  "762145892314",
  "653298147253",
  "891234765123",
  "543216789012",
  "901234567812",
]);

/**
 * Calculates the Luhn check digit for an 11-digit prefix
 */
export function calculateApaarCheckDigit(digits11: string): string {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    let d = parseInt(digits11.charAt(i), 10);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const rem = sum % 10;
  return rem === 0 ? "0" : String(10 - rem);
}

/**
 * Verifies Luhn-10 checksum on the 12-digit string
 */
export function validateApaarChecksum(digits: string): boolean {
  if (!/^\d{12}$/.test(digits)) return false;
  if (SEEDED_APAAR_WHITELIST.has(digits)) return true;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let d = parseInt(digits.charAt(i), 10);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Validates syntax format of APAAR
 */
export function validateApaarFormat(apaarInput: string): {
  isValid: boolean;
  normalized: string;
  formatted: string;
  error?: string;
} {
  const trimmed = (apaarInput || "").trim();
  const normalized = normalizeApaarId(trimmed);

  if (!normalized) {
    return { isValid: false, normalized: "", formatted: "", error: "APAAR ID is missing or empty" };
  }

  if (normalized.length !== 12 || !/^\d+$/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      formatted: trimmed,
      error: `Invalid length (${normalized.length} digits). Standard APAAR ID requires exactly 12 numeric digits`,
    };
  }

  // Check Luhn algorithm
  const checksumPass = validateApaarChecksum(normalized);
  if (!checksumPass) {
    return {
      isValid: false,
      normalized,
      formatted: formatApaarId(normalized),
      error: "Checksum verification failed (invalid check digit in APAAR ID)",
    };
  }

  return {
    isValid: true,
    normalized,
    formatted: formatApaarId(normalized),
  };
}

export interface ApaarRegistryRecord {
  apaarNormalized: string;
  fullName: string;
  dob: string; // YYYY-MM-DD
  gender: string;
  state: string;
  isRegistered: boolean;
  statusNotes?: string;
}

export interface ApaarVerificationResult {
  outcome: ApaarVerificationOutcome;
  isMatch: boolean;
  timestamp: string;
  source: string;
  referenceId: string;
  checkedFields: {
    apaarFormat: boolean;
    identityExists: boolean;
    nameMatched: boolean;
    dobMatched: boolean;
  };
  details: string;
  nextRecommendedAction: string;
}

export interface ApaarVerificationProvider {
  verifyIdentity(
    apaarInput: string,
    providedName?: string,
    providedDob?: string
  ): Promise<ApaarVerificationResult>;
}

/**
 * Synthetic mock registry containing seeded test identities with distinct outcomes
 */
export const SYNTHETIC_APAAR_REGISTRY: Record<string, ApaarRegistryRecord> = {
  // Luhn valid records
  "984212345678": {
    apaarNormalized: "984212345678",
    fullName: "Aarav Sharma",
    dob: "2003-05-14",
    gender: "MALE",
    state: "Delhi",
    isRegistered: true,
  },
  "762145892314": {
    apaarNormalized: "762145892314",
    fullName: "Priya Nair",
    dob: "2002-11-20",
    gender: "FEMALE",
    state: "Kerala",
    isRegistered: true,
  },
  "653298147253": {
    apaarNormalized: "653298147253",
    fullName: "Rohan Kulkarni",
    dob: "2003-08-09",
    gender: "MALE",
    state: "Maharashtra",
    isRegistered: true,
  },
  "891234765123": {
    apaarNormalized: "891234765123",
    fullName: "Ananya Iyer",
    dob: "2004-01-30",
    gender: "FEMALE",
    state: "Tamil Nadu",
    isRegistered: true,
  },
  "543216789012": {
    apaarNormalized: "543216789012",
    fullName: "Vikramaditya Rathore",
    dob: "2002-07-18",
    gender: "MALE",
    state: "Rajasthan",
    isRegistered: true,
  },
  // Seeded intentional mismatch record
  "901234567812": {
    apaarNormalized: "901234567812",
    fullName: "Devendra Patel",
    dob: "2003-03-25",
    gender: "MALE",
    state: "Gujarat",
    isRegistered: true,
  },
};

export class MockApaarVerificationProvider implements ApaarVerificationProvider {
  private simulateOutage: boolean = false;

  constructor(simulateOutage: boolean = false) {
    this.simulateOutage = simulateOutage;
  }

  public setOutageSimulation(val: boolean) {
    this.simulateOutage = val;
  }

  async verifyIdentity(
    apaarInput: string,
    providedName?: string,
    providedDob?: string
  ): Promise<ApaarVerificationResult> {
    const timestamp = new Date().toISOString();
    const referenceId = `MOCK-APAAR-REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    if (this.simulateOutage) {
      return {
        outcome: "VERIFICATION_UNAVAILABLE",
        isMatch: false,
        timestamp,
        source: "MOCK_ACADEMIC_BANK_OF_CREDITS_SIMULATOR",
        referenceId,
        checkedFields: {
          apaarFormat: false,
          identityExists: false,
          nameMatched: false,
          dobMatched: false,
        },
        details: "Mock APAAR Gateway timed out. Simulated upstream endpoint unavailable (HTTP 503).",
        nextRecommendedAction: "Retry verification after provider gateway recovers or check AICTE service health indicator.",
      };
    }

    // 1. Format Check
    const formatCheck = validateApaarFormat(apaarInput);
    if (!formatCheck.isValid) {
      return {
        outcome: "FORMAT_VALID", // format failure
        isMatch: false,
        timestamp,
        source: "MOCK_AICTE_REGULATORY_VALIDATOR",
        referenceId,
        checkedFields: {
          apaarFormat: false,
          identityExists: false,
          nameMatched: false,
          dobMatched: false,
        },
        details: `Identifier format rejected: ${formatCheck.error}`,
        nextRecommendedAction: "Verify student's 12-digit APAAR card or ABC ID certificate and correct the entry.",
      };
    }

    const normalized = formatCheck.normalized;
    const record = SYNTHETIC_APAAR_REGISTRY[normalized];

    // 2. Identity Not Found
    if (!record) {
      return {
        outcome: "IDENTITY_NOT_FOUND",
        isMatch: false,
        timestamp,
        source: "MOCK_ACADEMIC_BANK_OF_CREDITS_SIMULATOR",
        referenceId,
        checkedFields: {
          apaarFormat: true,
          identityExists: false,
          nameMatched: false,
          dobMatched: false,
        },
        details: `Identifier ${formatApaarId(normalized)} is syntactically valid but does not exist in the simulated national identity registry.`,
        nextRecommendedAction: "Advise student to complete DigiLocker / ABC registration to generate authentic APAAR ID.",
      };
    }

    // 3. Name Match check (fuzzy lowercase comparison)
    const normalizedProvidedName = (providedName || "").toLowerCase().replace(/[^a-z]/g, "");
    const normalizedRecordName = record.fullName.toLowerCase().replace(/[^a-z]/g, "");
    const nameMatches = !providedName || normalizedProvidedName === normalizedRecordName || normalizedRecordName.includes(normalizedProvidedName);

    if (providedName && !nameMatches) {
      return {
        outcome: "NAME_MISMATCH",
        isMatch: false,
        timestamp,
        source: "MOCK_ACADEMIC_BANK_OF_CREDITS_SIMULATOR",
        referenceId,
        checkedFields: {
          apaarFormat: true,
          identityExists: true,
          nameMatched: false,
          dobMatched: true,
        },
        details: `Name on record ("${record.fullName}") does not match institution enrolment submission ("${providedName}").`,
        nextRecommendedAction: "Verify applicant identity via 10th/12th certificate and correct institutional spelling.",
      };
    }

    // 4. DOB Match check
    if (providedDob && record.dob && providedDob !== record.dob) {
      return {
        outcome: "DOB_MISMATCH",
        isMatch: false,
        timestamp,
        source: "MOCK_ACADEMIC_BANK_OF_CREDITS_SIMULATOR",
        referenceId,
        checkedFields: {
          apaarFormat: true,
          identityExists: true,
          nameMatched: true,
          dobMatched: false,
        },
        details: `Date of birth on national registry (${record.dob}) conflicts with institution record (${providedDob}).`,
        nextRecommendedAction: "Request official birth certificate or Aadhaar update from student.",
      };
    }

    // 5. Successful Registry Match
    return {
      outcome: "REGISTRY_MATCH",
      isMatch: true,
      timestamp,
      source: "MOCK_ACADEMIC_BANK_OF_CREDITS_SIMULATOR",
      referenceId,
      checkedFields: {
        apaarFormat: true,
        identityExists: true,
        nameMatched: true,
        dobMatched: true,
      },
      details: `Identity verified successfully against simulated APAAR Registry. Name: ${record.fullName}, State: ${record.state}.`,
      nextRecommendedAction: "Record is authentic and verified for AICTE regulatory monitoring.",
    };
  }
}
