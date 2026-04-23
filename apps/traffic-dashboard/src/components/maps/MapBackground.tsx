export default function MapBackground() {
  return (
    <div className="absolute inset-0 z-0">
      {/* Satellite base */}
      <img
        className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRB6FLkFo4arMzk9fXRJZCK_VPRrrYOtxVgC_Zq1ADwTnMFiKbOCmgQdNhW_88h1bTtJLwhd1-4O6TjnAPdsIRSOsfXsvHhdr21tsKrdvx5Q4F5kNPd3kZLDsNPd8zhyDbrKorpSHPQEOk6biIbkN7ZbHg6GWOrgGJR6AuvREK5wTGgExWRU412sZfhhIZeFgybLFB7ypvGc2eDrLHIwGH71ejyKbE5D_tidVluxyQKvL0qzTXqQaIbCDYTzOqRUR6j5q31lbJV3w"
        alt="City map"
      />

      {/* Radial vignette */}
      <div className="absolute inset-0 map-gradient-overlay pointer-events-none" />

      {/* Heatmap blobs */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-red-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-orange-500 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-green-500 rounded-full blur-[100px]" />
      </div>

      {/* Speed-segment SVG overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-80"
        preserveAspectRatio="none"
        viewBox="0 0 1000 1000"
      >
        <path d="M100,200 L400,250 L600,400" fill="none" stroke="#ef4444" strokeWidth="4" />
        <path d="M400,250 L800,100" fill="none" stroke="#f59e0b" strokeWidth="4" />
        <path d="M100,500 L900,800" fill="none" stroke="#22c55e" strokeWidth="6" />
      </svg>
    </div>
  );
}
