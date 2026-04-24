export default function CallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <span
        className="material-symbols-outlined text-primary animate-spin"
        style={{ fontSize: 40 }}
      >
        progress_activity
      </span>
      <p className="text-on-surface-variant text-body-md">Signing you in…</p>
    </div>
  );
}
