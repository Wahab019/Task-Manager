// Defines the Pill behavior used in this module.
export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex bg-[#f0f0ee] px-2 py-1 text-[9px] font-bold tracking-wide text-primary uppercase">
      {children}
    </span>
  );
}
