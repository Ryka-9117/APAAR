import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { Role } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const institutionId = searchParams.get("institutionId") || undefined;
  const studentId = searchParams.get("studentId") || undefined;

  const credentials = store.getCredentials(institutionId, studentId);
  return NextResponse.json({ credentials });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, studentId, courseId, academicYear, credentialId, reason } = body;
    const actorRole = (request.headers.get("x-user-role") as Role) || "INSTITUTION_ADMIN";
    const actorId = request.headers.get("x-user-id") || "INSTITUTION-PORTAL";
    const actorName = request.headers.get("x-user-name") || "Institutional Officer";

    if (action === "ISSUE") {
      if (!studentId || !courseId || !academicYear) {
        return NextResponse.json(
          { error: "Missing required fields: studentId, courseId, academicYear" },
          { status: 400 }
        );
      }
      const cred = store.issueCredential(
        studentId,
        courseId,
        academicYear,
        actorId,
        actorRole,
        actorName
      );
      return NextResponse.json({ success: true, credential: cred }, { status: 201 });
    }

    if (action === "REVOKE") {
      if (!credentialId || !reason) {
        return NextResponse.json(
          { error: "Missing credentialId or revocation reason" },
          { status: 400 }
        );
      }
      const cred = store.revokeCredential(credentialId, reason, actorId, actorRole, actorName);
      return NextResponse.json({ success: true, credential: cred });
    }

    return NextResponse.json({ error: "Invalid action. Use ISSUE or REVOKE." }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
