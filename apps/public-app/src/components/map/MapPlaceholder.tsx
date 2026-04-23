import { Map } from "lucide-react";

interface MapPlaceholderProps {
  className?: string;
}

export function MapPlaceholder({ className = "" }: MapPlaceholderProps) {
  return (
    <div
      className={`relative flex-1 min-h-[500px] rounded-xl bg-zinc-900 ring-1 ring-zinc-800 overflow-hidden ${className}`}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Faux roads */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <line x1="0" y1="300" x2="800" y2="300" stroke="#22d3ee" strokeWidth="3" />
        <line x1="400" y1="0" x2="400" y2="600" stroke="#22d3ee" strokeWidth="2" />
        <line x1="0" y1="150" x2="800" y2="450" stroke="#a78bfa" strokeWidth="1.5" />
        <line x1="0" y1="450" x2="800" y2="150" stroke="#a78bfa" strokeWidth="1.5" />
        <circle cx="400" cy="300" r="80" stroke="#22d3ee" strokeWidth="1.5" fill="none" />
        <circle cx="400" cy="300" r="160" stroke="#22d3ee" strokeWidth="0.8" fill="none" />
        {/* Incident dots */}
        <circle cx="320" cy="260" r="6" fill="#ef4444" opacity="0.9" />
        <circle cx="480" cy="310" r="5" fill="#f97316" opacity="0.9" />
        <circle cx="390" cy="380" r="4" fill="#eab308" opacity="0.9" />
        <circle cx="560" cy="220" r="6" fill="#ef4444" opacity="0.9" />
      </svg>

      {/* Centre notice */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
        <div className="flex items-center justify-center size-14 rounded-full bg-zinc-800/80 ring-1 ring-zinc-700">
          <Map size={24} className="text-cyan-400" />
        </div>
        <p className="text-sm font-medium text-zinc-400">
          Mapbox integration coming soon
        </p>
        <p className="text-xs text-zinc-600 max-w-[220px] text-center">
          Replace this placeholder with a{" "}
          <code className="text-zinc-500">{"<MapboxMap />"}</code> component
          connected to the live data feed.
        </p>
      </div>
    </div>
  );
}
