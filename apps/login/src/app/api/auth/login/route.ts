import { NextResponse } from "next/server";

export function GET() {
  const keycloakUrl = process.env.KEYCLOAK_URL!;
  const realm = process.env.KEYCLOAK_REALM!;
  const clientId = process.env.KEYCLOAK_CLIENT_ID!;
  // redirect_uri points to the backend — backend owns the callback & token exchange
  const redirectUri = process.env.KEYCLOAK_REDIRECT_URI!;

  const authUrl = new URL(
    `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth`
  );
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile email");

  return NextResponse.redirect(authUrl.toString());
}
