// Client-side fallback: calls account.get() and redirects based on the result (works locally with localStorage)

"use client";

import { useRouter } from "next/navigation";
``;
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
