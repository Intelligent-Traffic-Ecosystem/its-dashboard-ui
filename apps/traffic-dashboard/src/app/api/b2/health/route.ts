import { NextResponse } from "next/server";
import { b2 } from "@/lib/b2";

export async function GET() {
  try {
    const data = await b2.health();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "upstream error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
