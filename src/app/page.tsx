"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { account } from "@/lib/appwrite";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    account
      .get()
      .then(() => {
        router.replace("/dashboard");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return null;
}
