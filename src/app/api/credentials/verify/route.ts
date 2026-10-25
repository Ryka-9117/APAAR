import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { verifyCredentialSignature } from "@/lib/crypto";

export async function POST(request: Request) {
  try {
    const { credentialId } = await request.json();

    if (!credentialId) {
      return NextResponse.json({ error: "Missing credentialId" }, { status: 400 });
    }

    const cred = store.getCredentialById(credentialId);
    if (!cred) {
      return NextResponse.json({
        verified: false,
        status: "NOT_FOUND",
        message: "No credential record exists with the provided ID in the AICTE National Academic Registry.",
        timestamp: new Date().toISOString(),
      });
    }

    const sigResult = verifyCredentialSignature(cred);

    if (!sigResult.isValid) {
      return NextResponse.json({
        verified: false,
        status: cred.status === "REVOKED" ? "REVOKED" : "SIGNATURE_INVALID",
        message: sigResult.reason || "Cryptographic signature mismatch.",
        credentialNumber: cred.credentialNumber,
        issuingInstitution: cred.payload.institutionName,
        programme: cred.payload.courseName,
        academicYear: cred.academicYear,
        issueDate: cred.issueDate,
        revokedAt: cred.revokedAt,
        revocationReason: cred.revocationReason,
        timestamp: new Date().toISOString(),
      });
    }

    // Authentic valid credential: return ONLY public non-PII fields
    return NextResponse.json({
      verified: true,
      status: "AUTHENTIC",
      credentialNumber: cred.credentialNumber,
      issuingInstitution: cred.payload.institutionName,
      programme: cred.payload.courseName,
      academicYear: cred.academicYear,
      issueDate: cred.issueDate,
      expiryDate: cred.expiryDate,
      signatureAlgorithm: cred.signature.algorithm,
      signatureTimestamp: cred.signature.timestamp,
      verificationTimestamp: new Date().toISOString(),
      governanceStatement: "Verified authentic against AICTE National Academic Registry with SHA-256 cryptographic proof.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
