"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

const MOBILE_BREAKPOINT = 1024;

interface SidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

// Provides shared sidebar state to descendant components.
export function SidebarProvider({ children }: { children: ReactNode }) {
  // On desktop the sidebar starts expanded; state controls collapsed vs full.
  // On mobile the sidebar starts hidden; state controls hidden vs visible.
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );

    // Closes the app sidebar when the viewport enters the mobile range.
    // That prevents the desktop sidebar state from leaking into the mobile layout.
    const handleMobileMatch = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsOpen(false);
      }
    };

    if (mediaQuery.matches) {
      setIsOpen(false);
    }

    mediaQuery.addEventListener("change", handleMobileMatch);
    return () => mediaQuery.removeEventListener("change", handleMobileMatch);
  }, []);

  // Flips the lightweight app sidebar between open and closed states.
  // Header and navigation controls call this shared action.
  const toggle = () => setIsOpen((prev) => !prev);
  // Closes the lightweight app sidebar from places like navigation links.
  // It gives mobile interactions a single way to dismiss the menu.
  const close = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Returns the sidebar context for components that need to read or change the shell sidebar state.
// It throws when used outside the matching provider.
export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}
