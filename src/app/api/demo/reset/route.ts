import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { confirm } = await request.json();

    if (!confirm) {
      return NextResponse.json(
        { error: "Confirmation required to reset demonstration environment." },
        { status: 400 }
      );
    }

    store.resetDemoData();
    return NextResponse.json({
      success: true,
      message: "Demonstration database reset to pristine deterministic seed state.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
