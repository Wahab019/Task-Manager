"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

/** Viewport width below which the sidebar uses its mobile behavior. */
const MOBILE_BREAKPOINT = 1024;

/** Shared sidebar visibility state and actions for the application shell. */
interface SidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

/** Context value supplied to sidebar-aware descendants. */
const SidebarContext = createContext<SidebarContextValue | null>(null);

/** Props accepted by {@link SidebarProvider}. */
type SidebarProviderProps = {
  children: ReactNode;
};

/**
 * Provides shared responsive sidebar state to descendant components.
 *
 * The sidebar starts expanded and switches to closed when the viewport enters
 * the mobile range, preventing desktop layout state from leaking into mobile.
 */
export function SidebarProvider({ children }: SidebarProviderProps) {
  /** Sidebar visibility state shared by the header and navigation components. */
  const [isOpen, setIsOpen] = useState(true);

  /**
   * Synchronizes sidebar visibility with the mobile media-query state.
   * The listener is removed when the provider unmounts.
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );

    /** Closes the sidebar when the viewport enters the mobile range. */
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

  /** Flips the sidebar between open and closed states. */
  const toggle = () => setIsOpen((prev) => !prev);
  /** Closes the sidebar for actions such as mobile navigation. */
  const close = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Returns shared sidebar state and actions from the nearest provider.
 * Throws when called outside a {@link SidebarProvider}.
 */
export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}
