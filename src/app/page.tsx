"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("task-manager-auth") === "true";
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [router]);

  return null;
}
