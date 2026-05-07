interface MapNavControlsProps {
  zoom: number;
  bearing: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCompass: () => void;
}

export default function MapNavControls({
  zoom,
  bearing,
  onZoomIn,
  onZoomOut,
  onCompass,
}: MapNavControlsProps) {
  return (
    <div className="absolute top-lg right-lg z-30 flex flex-col gap-1">
      <button
        className="w-10 h-10 bg-[#1A2636] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        title={`Zoom in (${Math.round(zoom * 100)}%)`}
        onClick={onZoomIn}
      >
        <span className="material-symbols-outlined">add</span>
      </button>
      <button
        className="w-10 h-10 bg-[#1A2636] border border-white/10 border-t-0 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        title={`Zoom out (${Math.round(zoom * 100)}%)`}
        onClick={onZoomOut}
      >
        <span className="material-symbols-outlined">remove</span>
      </button>
      <button
        className="w-10 h-10 bg-[#1A2636] border border-white/10 mt-2 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        title={`Rotate map (${bearing} degrees)`}
        onClick={onCompass}
      >
        <span className="material-symbols-outlined" style={{ transform: `rotate(${bearing}deg)` }}>
          explore
        </span>
      </button>
    </div>
  );
}
