import crypto from "crypto";
import { AuditEvent, StudentCredential } from "./types";

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
const SECRET_SIGNING_KEY = process.env.VIDYA_SIGNING_SECRET || "vidya-setu-aicte-demo-ecdsa-ed25519-secret-key-2024";

/**
 * Deterministically sorts object keys for canonical JSON serialization
 */
export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJsonStringify).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (key) => `${JSON.stringify(key)}:${canonicalJsonStringify((obj as Record<string, unknown>)[key])}`
  );
  return "{" + pairs.join(",") + "}";
}

/**
 * Computes SHA-256 hash in hexadecimal
 */
export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Computes cryptographic hash for an audit event chained with previous hash
 */
export function computeAuditEventHash(event: Omit<AuditEvent, "currentHash">): string {
  const canonicalPayload = canonicalJsonStringify({
    id: event.id,
    eventNumber: event.eventNumber,
    timestamp: event.timestamp,
    actorId: event.actorId,
    actorRole: event.actorRole,
    actionType: event.actionType,
    targetEntity: event.targetEntity,
    targetReference: event.targetReference,
    result: event.result,
    metadata: event.metadata,
    previousHash: event.previousHash,
  });
  return sha256(canonicalPayload);
}

/**
 * Verifies the entire audit trail hash chain integrity
 */
export function verifyAuditChain(events: AuditEvent[]): {
  isValid: boolean;
  totalChecked: number;
  lastVerifiedTimestamp: string;
  firstMismatchIndex?: number;
  mismatchDetails?: string;
} {
  if (!events || events.length === 0) {
    return {
      isValid: true,
      totalChecked: 0,
      lastVerifiedTimestamp: new Date().toISOString(),
    };
  }

  // Sort events chronologically by eventNumber
  const sorted = [...events].sort((a, b) => a.eventNumber - b.eventNumber);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    // Check genesis or previous link
    if (i === 0) {
      if (current.previousHash !== GENESIS_HASH) {
        return {
          isValid: false,
          totalChecked: i,
          lastVerifiedTimestamp: current.timestamp,
          firstMismatchIndex: i,
          mismatchDetails: `Genesis event (#${current.eventNumber}) previousHash mismatch. Expected ${GENESIS_HASH}, got ${current.previousHash}`,
        };
      }
    } else {
      const prior = sorted[i - 1];
      if (current.previousHash !== prior.currentHash) {
        return {
          isValid: false,
          totalChecked: i,
          lastVerifiedTimestamp: current.timestamp,
          firstMismatchIndex: i,
          mismatchDetails: `Chain break at event #${current.eventNumber}. previousHash (${current.previousHash.slice(0, 12)}...) does not match prior event #${prior.eventNumber} hash (${prior.currentHash.slice(0, 12)}...)`,
        };
      }
    }

    // Recompute current event hash
    const expectedCurrentHash = computeAuditEventHash(current);
    if (current.currentHash !== expectedCurrentHash) {
      return {
        isValid: false,
        totalChecked: i,
        lastVerifiedTimestamp: current.timestamp,
        firstMismatchIndex: i,
        mismatchDetails: `Payload tampering detected at event #${current.eventNumber} (${current.actionType}). Stored hash (${current.currentHash.slice(0, 12)}...) does not match recomputed hash (${expectedCurrentHash.slice(0, 12)}...)`,
      };
    }
  }

  return {
    isValid: true,
    totalChecked: sorted.length,
    lastVerifiedTimestamp: sorted[sorted.length - 1].timestamp,
  };
}

/**
 * Digitally signs a canonical credential payload with server-side HMAC-SHA256
 */
export function signCredentialPayload(payload: StudentCredential["payload"]): {
  algorithm: "HMAC-SHA256";
  keyId: string;
  signatureHex: string;
  timestamp: string;
} {
  const canonical = canonicalJsonStringify(payload);
  const timestamp = new Date().toISOString();
  const signatureHex = crypto
    .createHmac("sha256", SECRET_SIGNING_KEY)
    .update(`${canonical}:${timestamp}`, "utf8")
    .digest("hex");

  return {
    algorithm: "HMAC-SHA256",
    keyId: "aicte-vidya-root-key-2024",
    signatureHex,
    timestamp,
  };
}

/**
 * Verifies the digital signature of a StudentCredential
 */
export function verifyCredentialSignature(credential: StudentCredential): {
  isValid: boolean;
  reason?: string;
} {
  const canonical = canonicalJsonStringify(credential.payload);
  const expectedSignature = crypto
    .createHmac("sha256", SECRET_SIGNING_KEY)
    .update(`${canonical}:${credential.signature.timestamp}`, "utf8")
    .digest("hex");

  if (credential.signature.signatureHex !== expectedSignature) {
    return {
      isValid: false,
      reason: "Cryptographic signature check failed. Stored credential payload has been modified or signature key mismatch.",
    };
  }

  if (credential.status === "REVOKED") {
    return {
      isValid: false,
      reason: `Credential was revoked on ${credential.revokedAt || "N/A"}. Reason: ${credential.revocationReason || "Administrative invalidation"}`,
    };
  }

  if (credential.status === "EXPIRED") {
    return {
      isValid: false,
      reason: "Credential validity period has expired.",
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Generates simulated OTP (6 digits)
 */
export function generateSimulatedOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
