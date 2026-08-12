import type { ReactNode } from "react";

// Defines the shared Next.js layout wrapper for this route segment.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f1e8] px-4 py-8 text-[#1a1a1a] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-84 flex-col justify-center">
        <section className="rounded-md bg-white px-7 py-9 shadow-[0_18px_35px_rgba(43,48,43,0.09)] sm:px-10 sm:py-10">
          {children}
        </section>
      </div>
    </main>
  );
}
