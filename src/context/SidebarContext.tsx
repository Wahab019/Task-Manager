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

    // Handles the mobile match interaction.
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

  // Defines the toggle behavior used in this module.
  const toggle = () => setIsOpen((prev) => !prev);
  // Defines the close behavior used in this module.
  const close = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Returns the sidebar hook value for consumers.
export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}
