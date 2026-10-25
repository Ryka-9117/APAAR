import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const institutionId = searchParams.get("institutionId") || undefined;
  const duplicates = store.getDuplicates(institutionId);
  return NextResponse.json({ duplicates, count: duplicates.length });
}

export async function POST(request: Request) {
  try {
    const { caseId, reviewStatus, resolutionReason, reviewerName } = await request.json();

    if (!caseId || !reviewStatus) {
      return NextResponse.json(
        { error: "Missing required caseId or reviewStatus" },
        { status: 400 }
      );
    }

    const updated = store.updateDuplicateStatus(
      caseId,
      reviewStatus,
      resolutionReason || "Status updated by authorized reviewer",
      reviewerName || "AICTE Compliance Officer"
    );

    if (!updated) {
      return NextResponse.json({ error: "Duplicate case not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, duplicateCase: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
