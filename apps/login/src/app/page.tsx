"use client";

import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  function handleSignIn() {
    setLoading(true);
    window.location.href = "/api/auth/login";
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#10131a] px-4">

      {/* Subtle grid */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(173,198,255,0.04) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(173,198,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top glow */}
      <div
        aria-hidden
        className="fixed top-[-80px] left-1/2 -translate-x-1/2 w-[480px] h-[260px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(173,198,255,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative flex flex-col items-center gap-8 w-full max-w-[360px]">

        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border"
            style={{ background: "#1d2027", borderColor: "#424754" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 30, color: "#adc6ff" }}
            >
              traffic
            </span>
          </div>

          <div className="text-center">
            <p
              className="text-[28px] font-bold leading-none tracking-tight"
              style={{ color: "#e1e2ec", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              ITS Portal
            </p>
            <p className="text-[13px] mt-1" style={{ color: "#8c909f" }}>
              Intelligent Traffic System · District 4
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-2xl p-7 flex flex-col gap-5"
          style={{
            background: "#1d2027",
            border: "1px solid #424754",
            boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
          }}
        >
          <div>
            <p className="text-[18px] font-semibold" style={{ color: "#e1e2ec" }}>
              Sign in to your account
            </p>
            <p className="text-[13px] mt-0.5" style={{ color: "#8c909f" }}>
              You will be redirected to the ITS identity provider.
            </p>
          </div>

          {/* Role badges */}
          <div className="flex gap-2">
            {["Admin", "Traffic Operator"].map((role) => (
              <span
                key={role}
                className="text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md"
                style={{ background: "#272a31", color: "#c2c6d6", border: "1px solid #424754" }}
              >
                {role}
              </span>
            ))}
          </div>

          {/* Sign in button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 font-semibold text-[14px] transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#4d8eff", color: "#fff" }}
          >
            {loading ? (
              <>
                <span
                  className="material-symbols-outlined animate-spin"
                  style={{ fontSize: 18 }}
                >
                  progress_activity
                </span>
                Redirecting…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  shield_person
                </span>
                Continue with SSO
              </>
            )}
          </button>

          <p className="text-center text-[12px]" style={{ color: "#424754" }}>
            Secured by Keycloak · TLS encrypted
          </p>
        </div>

        {/* Footer */}
        <p className="text-[12px]" style={{ color: "#424754" }}>
          Authorised personnel only · District 4 Metro Authority
        </p>
      </div>
    </div>
  );
}
