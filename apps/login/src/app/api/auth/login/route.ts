import { NextResponse } from "next/server";

export function GET() {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { error: "Missing BACKEND_URL configuration" },
      { status: 500 }
    );
  }

  // Redirect to the backend, which generates a CSRF state token and redirects to Keycloak.
  return NextResponse.redirect(`${backendUrl}/api/auth/begin`);
}
