export default function MapNavControls() {
  return (
    <div className="absolute top-lg right-lg z-30 flex flex-col gap-1">
      {/* Zoom in */}
      <button className="w-10 h-10 bg-[#1A2636] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
        <span className="material-symbols-outlined">add</span>
      </button>
      {/* Zoom out */}
      <button className="w-10 h-10 bg-[#1A2636] border border-white/10 border-t-0 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
        <span className="material-symbols-outlined">remove</span>
      </button>
      {/* Compass */}
      <button className="w-10 h-10 bg-[#1A2636] border border-white/10 mt-2 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
        <span className="material-symbols-outlined">explore</span>
      </button>
    </div>
  );
}
