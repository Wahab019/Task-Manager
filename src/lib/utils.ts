import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// src/lib/utils.ts (add this alongside your existing helpers)
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function formatDueLabel(deadline: string): string {
  const now = new Date();
  const dueDate = new Date(`${deadline}T00:00:00`);

  if (Number.isNaN(dueDate.getTime())) {
    return "";
  }

  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  });
  const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDueDate = new Date(dueDate);
  startOfDueDate.setHours(0, 0, 0, 0);
  const dayDifference = Math.round(
    (startOfDueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDifference === 0) {
    const hours = Math.max(1, Math.ceil(diffHours));
    return `Due in ${hours} hour${hours === 1 ? "" : "s"}`;
  }

  if (dayDifference === 1) {
    return "Due Tomorrow";
  }

  if (dayDifference > 1 && dayDifference <= 7) {
    return `Due ${dayFormatter.format(dueDate)}`;
  }

  return `Due ${monthDayFormatter.format(dueDate)}`;
}
