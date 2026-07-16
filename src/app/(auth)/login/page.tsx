import Link from "next/link";
import { ArrowRight, CircleHelp, Globe2, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
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

      <div className="space-y-5">
        <label className="block space-y-1.5">
          <span className="text-xs font-bold tracking-[0.01em] text-[#4b5550]">
            Email Address
          </span>
          <input
            type="email"
            defaultValue="executive@heritage.com"
            className="h-11 w-full rounded-[3px] border border-[#dce0dd] px-3 text-sm text-[#3f4944] outline-none placeholder:text-[#9ba29e] focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-bold tracking-[0.01em] text-[#4b5550]"
            >
              Password
            </label>
            <Link
              href="/reset-password"
              className="text-[10px] font-bold text-primary underline underline-offset-2"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            defaultValue="password"
            className="h-11 w-full rounded-[3px] border border-[#dce0dd] px-3 text-sm text-[#3f4944] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#69716d]">
          <input
            type="checkbox"
            className="size-3.5 rounded-xs border-[#dce0dd] accent-primary"
          />
          Remember this workstation
        </label>

        <Button
          variant="heritage"
          size="lg"
          type="button"
          className="h-12 w-full text-xs"
        >
          Log In <ArrowRight className="size-4" />
        </Button>
      </div>

      <footer className="border-t border-[#eef0ee] pt-7 text-center">
        <p className="mx-auto max-w-60 text-xs leading-4 italic text-[#8a918e]">
          “Precision in Every Second, Heritage in Every Task.”
        </p>
        <div className="mt-5 flex justify-center gap-4 text-[#59625d]">
          <CircleHelp className="size-4" strokeWidth={1.8} />
          <Globe2 className="size-4" strokeWidth={1.8} />
        </div>
      </footer>
    </div>
  );
}
