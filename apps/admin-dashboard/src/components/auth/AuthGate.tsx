"use client";

import { useEffect, useState } from "react";

type AuthGateProps = {
  children: React.ReactNode;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const loginAppUrl = process.env.NEXT_PUBLIC_LOGIN_APP_URL || "http://localhost:3003";

export default function AuthGate({ children }: AuthGateProps) {
  const [status, setStatus] = useState<"checking" | "ready">("checking");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const response = await fetch(`${backendUrl}/api/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          window.location.href = `${loginAppUrl}/login/api/auth/login`;
          return;
        }

        if (mounted) {
          setStatus("ready");
        }
      } catch {
        window.location.href = `${loginAppUrl}/login/api/auth/login`;
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (status !== "ready") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest text-on-surface">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <p className="text-sm text-on-surface-variant">Checking your session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}