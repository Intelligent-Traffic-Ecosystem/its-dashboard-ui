// TODO: Replace this entire component with Mapbox GL JS:
// npm install react-map-gl mapbox-gl
// Use NEXT_PUBLIC_MAPBOX_TOKEN env variable
// Add heatmap source from B2 congestion data
// Add camera markers from B1 metadata API

import { Map } from "lucide-react";

interface MapPlaceholderProps {
  className?: string;
}

export function MapPlaceholder({ className = "" }: MapPlaceholderProps) {
  return (
    <div
      className={`relative flex-1 min-h-[320px] rounded-xl overflow-hidden sm:min-h-[500px] ${className}`}
      style={{ background: "#0A0E1A", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Subtle grid overlay simulating map tiles */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Congestion heatmap blobs */}
      {/* Red blob — Galle Road area (critical congestion) */}
      <div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 120,
          top: "42%",
          left: "26%",
          background: "radial-gradient(ellipse, rgba(239,68,68,0.45) 0%, rgba(239,68,68,0.12) 50%, transparent 75%)",
          filter: "blur(18px)",
        }}
      />
      {/* Orange blob — Baseline/Borella area (heavy congestion) */}
      <div
        className="absolute rounded-full"
        style={{
          width: 160,
          height: 100,
          top: "58%",
          left: "50%",
          background: "radial-gradient(ellipse, rgba(209,105,0,0.40) 0%, rgba(209,105,0,0.10) 50%, transparent 75%)",
          filter: "blur(16px)",
        }}
      />
      {/* Green blob — Expressway (free flow) */}
      <div
        className="absolute rounded-full"
        style={{
          width: 130,
          height: 80,
          top: "22%",
          left: "65%",
          background: "radial-gradient(ellipse, rgba(34,197,94,0.30) 0%, rgba(34,197,94,0.08) 50%, transparent 75%)",
          filter: "blur(14px)",
        }}
      />

      {/* Faux road network */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Major roads */}
        <line x1="0" y1="300" x2="800" y2="300" stroke="rgba(75,85,99,0.5)" strokeWidth="3" />
        <line x1="400" y1="0" x2="400" y2="600" stroke="rgba(75,85,99,0.5)" strokeWidth="2.5" />
        <line x1="0" y1="160" x2="800" y2="440" stroke="rgba(75,85,99,0.4)" strokeWidth="2" />
        <line x1="0" y1="440" x2="800" y2="160" stroke="rgba(75,85,99,0.4)" strokeWidth="2" />
        {/* Secondary roads */}
        <line x1="200" y1="0" x2="200" y2="600" stroke="rgba(75,85,99,0.25)" strokeWidth="1.5" />
        <line x1="600" y1="0" x2="600" y2="600" stroke="rgba(75,85,99,0.25)" strokeWidth="1.5" />
        <line x1="0" y1="450" x2="800" y2="450" stroke="rgba(75,85,99,0.25)" strokeWidth="1.5" />
        <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(75,85,99,0.25)" strokeWidth="1.5" />
        {/* City ring */}
        <circle cx="400" cy="300" r="100" stroke="rgba(75,85,99,0.3)" strokeWidth="1.5" fill="none" strokeDasharray="6 3" />

        {/* Incident marker pins */}
        {/* Critical — Galle Rd */}
        <circle cx="270" cy="270" r="7" fill="#EF4444" opacity="0.95" />
        <circle cx="270" cy="270" r="12" fill="rgba(239,68,68,0.2)" />

        {/* Warning — Baseline */}
        <circle cx="460" cy="350" r="6" fill="#D16900" opacity="0.95" />
        <circle cx="460" cy="350" r="10" fill="rgba(209,105,0,0.2)" />

        {/* Warning — Marine Drive */}
        <circle cx="360" cy="400" r="5" fill="#D16900" opacity="0.9" />
        <circle cx="360" cy="400" r="9" fill="rgba(209,105,0,0.18)" />

        {/* Critical — Tunnel */}
        <circle cx="530" cy="230" r="7" fill="#EF4444" opacity="0.95" />
        <circle cx="530" cy="230" r="12" fill="rgba(239,68,68,0.2)" />
      </svg>

      {/* Map controls — top right */}
      <div className="absolute top-4 right-4 flex flex-col gap-1">
        {["+", "−"].map((btn) => (
          <button
            key={btn}
            className="flex size-8 items-center justify-center rounded-lg text-sm font-bold transition-colors"
            style={{
              background: "#1A1D27",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#ffffff",
              cursor: "default",
            }}
          >
            {btn}
          </button>
        ))}
      </div>

      {/* Center notice */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
        <div
          className="flex items-center justify-center size-14 rounded-full"
          style={{ background: "rgba(26,29,39,0.85)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <Map size={24} style={{ color: "#4CD7F6" }} />
        </div>
        <div
          className="rounded-lg px-4 py-2 text-center"
          style={{ background: "rgba(15,17,23,0.80)", backdropFilter: "blur(8px)" }}
        >
          <p className="text-sm font-medium text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Mapbox integration coming soon
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#757780" }}>
            Replace with <code className="text-secondary">react-map-gl</code> connected to live feed
          </p>
        </div>
      </div>
    </div>
  );
}
