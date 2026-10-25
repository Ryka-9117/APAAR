import { NextResponse } from "next/server";
import { MockApaarVerificationProvider } from "@/lib/apaar";
import { store } from "@/lib/store";

const apaarProvider = new MockApaarVerificationProvider();

export async function POST(request: Request) {
  try {
    const { apaarId, fullName, dob, studentId, simulateOutage } = await request.json();

    if (!apaarId) {
      return NextResponse.json({ error: "Missing required apaarId" }, { status: 400 });
    }

    if (simulateOutage !== undefined) {
      apaarProvider.setOutageSimulation(Boolean(simulateOutage));
    }

    const result = await apaarProvider.verifyIdentity(apaarId, fullName, dob);

    // If studentId provided, update the student record in store
    if (studentId) {
      store.updateStudent(
        studentId,
        {
          apaarStatus: result.outcome,
          apaarVerifiedAt: result.timestamp,
        },
        "AICTE-APAAR-VAL",
        "AICTE_ADMIN",
        "AICTE APAAR Gateway"
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
