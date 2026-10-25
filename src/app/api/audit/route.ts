import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { verifyAuditChain } from "@/lib/crypto";

export async function GET() {
  const events = store.getAuditEvents();
  const isTamperActive = store.isTamperActive();
  const verification = verifyAuditChain(events);

  return NextResponse.json({
    events,
    isTamperActive,
    verification,
  });
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === "SIMULATE_TAMPER") {
      const result = store.simulateAuditTamper();
      const updatedEvents = store.getAuditEvents();
      const verification = verifyAuditChain(updatedEvents);
      return NextResponse.json({
        success: result.success,
        tamperedEventId: result.tamperedEventId,
        verification,
      });
    }

    if (action === "RESTORE_TAMPER") {
      const result = store.restoreAuditTamper();
      const updatedEvents = store.getAuditEvents();
      const verification = verifyAuditChain(updatedEvents);
      return NextResponse.json({
        success: result.success,
        verification,
      });
    }

    if (action === "VERIFY") {
      const events = store.getAuditEvents();
      const verification = verifyAuditChain(events);
      return NextResponse.json({ verification });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
