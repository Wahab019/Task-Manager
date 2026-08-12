// Renders a small uppercase label for task metadata.
// It keeps pill spacing and typography consistent across task UI.
export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex bg-[#f0f0ee] px-2 py-1 text-[9px] font-bold tracking-wide text-primary uppercase">
      {children}
    </span>
  );
}
