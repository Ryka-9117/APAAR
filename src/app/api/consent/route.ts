import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId") || undefined;
  const token = searchParams.get("token") || undefined;

  // Employer querying with time-limited token
  if (token) {
    const all = store.getConsentRequests();
    const matched = all.find((r) => r.verificationToken === token && r.status === "APPROVED");
    if (!matched) {
      return NextResponse.json(
        { error: "Invalid, expired, or revoked verification token" },
        { status: 403 }
      );
    }

    if (matched.tokenExpiresAt && new Date(matched.tokenExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 403 }
      );
    }

    const cred = store.getCredentialById(matched.credentialId);
    if (!cred) {
      return NextResponse.json({ error: "Linked credential not found" }, { status: 404 });
    }

    // Build purpose-limited response based strictly on approved fields
    const approvedResponse: Record<string, unknown> = {
      verified: true,
      credentialNumber: cred.credentialNumber,
      verificationTimestamp: new Date().toISOString(),
      employerPurpose: matched.purpose,
      scopeGranted: matched.requestedFields,
    };

    if (matched.requestedFields.includes("courseName")) {
      approvedResponse.course = cred.payload.courseName;
    }
    if (matched.requestedFields.includes("academicYear")) {
      approvedResponse.academicYear = cred.payload.academicYear;
    }
    if (matched.requestedFields.includes("institutionName")) {
      approvedResponse.institution = cred.payload.institutionName;
    }
    if (matched.requestedFields.includes("completionStatus")) {
      approvedResponse.completionStatus = cred.payload.completionStatus;
    }

    return NextResponse.json(approvedResponse);
  }

  const requests = store.getConsentRequests(studentId);
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, credentialId, requestingEmployer, purpose, requestedFields, requestId, approved, otp } = body;

    if (action === "CREATE") {
      if (!credentialId || !requestingEmployer || !purpose) {
        return NextResponse.json(
          { error: "Missing required fields for consent initiation" },
          { status: 400 }
        );
      }
      const req = store.createConsentRequest(
        credentialId,
        requestingEmployer,
        purpose,
        requestedFields || ["courseName", "academicYear", "completionStatus", "institutionName"]
      );
      return NextResponse.json({ success: true, consentRequest: req }, { status: 201 });
    }

    if (action === "RESPOND") {
      if (!requestId) {
        return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
      }
      const res = store.respondToConsent(requestId, Boolean(approved), otp);
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid action. Use CREATE or RESPOND." }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
