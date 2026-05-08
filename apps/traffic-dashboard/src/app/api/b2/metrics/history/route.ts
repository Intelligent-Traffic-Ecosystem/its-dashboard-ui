import { NextRequest, NextResponse } from "next/server";
import { b2 } from "@/lib/b2";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const camera_id = searchParams.get("camera_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!camera_id || !from || !to) {
    return NextResponse.json(
      { error: "camera_id, from, and to are required" },
      { status: 400 }
    );
  }

  try {
    const data = await b2.metricsHistory(camera_id, from, to);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "upstream error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
