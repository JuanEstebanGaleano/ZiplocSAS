export default function LoadingSpinner() {
  return (
    <div className="flex flex-col gap-3 w-full" aria-live="polite" aria-busy="true">
      <div className="flex flex-col gap-3" aria-hidden="true">
        <div className="h-4 bg-superficie border border-borde rounded animate-pulse w-3/4" />
        <div className="h-[72px] bg-superficie border border-borde rounded animate-pulse w-full" />
        <div className="h-4 bg-superficie border border-borde rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}