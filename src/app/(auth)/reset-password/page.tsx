"use client";

import Link from "next/link";
import { Check, Landmark } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <Landmark className="size-7" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-[25px] leading-none font-semibold text-primary">
            Executive Heritage
          </h1>
          <p className="mt-2 text-[11px] font-bold tracking-[0.13em] text-secondary">
            TRACKER &amp; ARCHIVE
          </p>
        </div>
      </header>

      <div className="text-center">
        <h2 className="text-2xl font-semibold text-primary">Reset Password</h2>
        <p className="mt-2 text-xs leading-5 text-[#737b76]">
          Enter your email and we&apos;ll send you a secure reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-[#4b5550]">
            Email Address
          </span>
          <input
            type="email"
            defaultValue="executive@heritage.com"
            className="h-11 w-full rounded-[3px] border border-[#dce0dd] px-3 text-sm text-[#3f4944] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>
        <Button
          variant="heritage"
          size="lg"
          type="submit"
          className="h-12 w-full text-xs"
        >
          Send Reset Link
        </Button>
        <Link
          href="/login"
          className="block text-center text-xs font-bold text-secondary"
        >
          Back to Login
        </Link>
      </form>

      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#262924]/25 px-4 backdrop-blur-sm">
          <section className="w-full max-w-[18.2rem] rounded-md bg-white px-9 py-9 text-center shadow-[0_20px_35px_rgba(31,35,32,0.22)]">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#b7e2d3] text-primary">
              <Check className="size-6" strokeWidth={3} />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-primary">
              Reset Link Sent
            </h2>
            <p className="mt-1 text-xs leading-[1.45] text-[#69716d]">
              We&apos;ve sent a secure link to your email address. Please check
              your inbox and follow the instructions to reset your password.
            </p>
            <Link
              href="/login"
              className="mt-6 flex h-9 w-full items-center justify-center rounded-[3px] bg-primary text-[10px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#0a3026]"
            >
              Back to Login
            </Link>
            <button
              type="button"
              className="mt-4 text-[10px] font-bold text-secondary"
            >
              Resend Email
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
